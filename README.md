# Index gypsum metadata

[![Tests](https://github.com/ArtifactDB/gypsum-metadata-index/actions/workflows/run-tests.yaml/badge.svg)](https://github.com/ArtifactDB/gypsum-metadata-index/actions/workflows/run-tests.yaml)

## Introduction

This repository contains scripts to index metadata stored in a [**gypsum** backend](https://github.com/ArtifactDB/gypsum-worker).
Each index is a self-contained SQLite file that can be downloaded and queried without further reliance on the backend.
We construct new indices by inspecting the backend for JSON metadata documents within each project-asset-version combination;
existing indices are updated by routinely scanning the [logs](https://github.com/ArtifactDB/gypsum-worker#parsing-logs) for new content.

This documentation is intended for system administrators to generate new indices, or developers of packages that use the indices.
Users should not have to interact with these indices directly, as this should be mediated by client packages in relevant frameworks like R/Bioconductor.
For example, the [gypsum R client](https://github.com/ArtifactDB/gypsum-R) provides functions for downloading and caching the indices,
which are then called by more user-facing packages like the [scRNAseq](https://github.com/LTLA/scRNAseq) R package.

## Concepts

### Metadata documents

All metadata documents should be JSON-formatted and assigned to a particular project-asset-version in the **gypsum** backend.
The scripts in this repository will scrape the contents of the backend to identify metadata documents to add to the index.

One SQLite index is generated for each "class" of metadata documents.
All metadata documents of the same class should have the same base name, i.e., after removing any directories or `/`-delimited prefix.
Typically, each metadata class corresponds to a specific [JSON schema](https://json-schema.org) used to validate its documents;
this suggests that the documents are comparable with similar structure and values, though this is not strictly required for indexing.

Metadata documents are stored losslessly in the SQLite file as a [JSONB](https://sqlite.org/jsonb.html) column.
This can be directly used for queries via SQLite's various `json_*` methods.

While most of this documentation will focus on files stored on **gypsum**'s R2 bucket, the same code can also be used for **gypsum**-compatible stores on local filesystems.
This means that on-premise metadata documents (e.g., managed by the [Gobbler](https://github.com/ArtifactDB/gobbler)) can be indexed into equivalent SQLite files.

### Tokenization

To enable efficient text search, string properties in each metadata document are converted into (field, token) pairs for indexing.
The field name for each property is defined as its `.`-seperated path within the document, assuming that no properties have `.` in the name.
For arrays, each item is treated as a separate token with the same field name as the array itself - we do not distinguish based on the ordering of items.

```js
{
    "a": {
        "b": {
            "c": 1, // field name is 'a.b.c'
            "d": "asdasd" // field name is 'a.b.d'
        },
        "e": [
            "qwerty", // field name is 'a.e',
            {
                "f": 100 // field name is 'a.e.f'
            }
        ]
    }
}
```

Our tokenization scheme is adapted from the [FTS5 Unicode61 tokenizer](https://www.sqlite.org/fts5.html#unicode61_tokenizer).
Each string is normalized to remove diacritics, converted into lowercase, and then split at any character that is not a Unicode letter/number or a dash.
We consider dashes as part of the token to preserve scientific terms like gene names.

## SQLite file structure

### `versions` 

This is a table where each row corresponds to a successfully indexed project-asset-combination.
The table contains the following fields: 

- `vid`: integer, the version ID and the primary key for this table.
- `project`: text, the name of the project.
- `asset`: text, the name of the asset.
- `version`: text, the name of the version.
- `latest`: integer (1 or 0), whether this version is the latest for its asset. 

Multicolumn indices are available for `(project, asset, version)` and `(latest, project, asset)`.

### `paths`

This is a table where each row corresponds to a metadata file within a project-asset-combination.
It contains the following columns: 

- `pid`: integer, the path ID and the primary key for this table.
- `vid`: integer, a version ID from `versions`, specifying the project-asset-version containing this metadata file.
- `path`: text, the relative path to the metadata file inside the project-asset-version's directory.
  For R2-based stores, this is the suffix to be added to `{project}/{asset}/{version}` to obtain the object key of the file.
- `metadata`: blob, the contents of the metadata file as JSONB.

An index is available for `path`.

### `tokens`

This is a table where each row corresponds to a unique token.
It contains the following columns:

- `tid`: integer, the token ID and the primary key for this table.
- `token`: text, the token.

An index is available for `token`.

### `fields`

This is a table where each row corresponds to a unique field name.
It contains the following columns:

- `fid`: integer, the field name ID and the primary key for this table.
- `field`: text, the field name.

An index is available for `field`.

### `links`

This is a table where each row defines to a relationship between a metadata file, the field name and token.
It contains the following columns:

- `pid`: integer, the path ID from `paths`.
- `fid`: integer, the field name ID from `fields`.
- `tid`: integer, the token ID from `tokens`.

The existence of a row indicates that a token (from `tid`) is found in a field (named as `fid`) of a metadata file (at `pid`).

A multicolumn index is available for `(tid, fid)`.

## Building indices

### Comments

The [`scripts/`](scripts/) subdirectory contains several scripts for generating and updating the SQLite files.
These expect to have a modestly recent version of Node.js (tested on 16.19.1).
Required dependencies can be installed with the usual `npm install` process.
Each script can either be run directly or via `npx`:

```shell
# Older versions of Node.js may need a preceding NODE_OPTIONS='--experimental-fetch'.
./scripts/fresh.js --class BASENAME,DBNAME --gypsum URL --dir DIR

# Alternatively, to run from packages depending on this one:
npx --package=gypsum-metadata-index fresh --class BASENAME,DBNAME --gypsum URL --dir DIR
```

All scripts have the following arguments in common:

- `--class BASENAME,DBNAME`: a string describing a metadata document class.
  This should contain the base name of each metadata document and the name of the SQLite file in which to save the metadata, separated by a comma.
  This argument may be specified multiple times for different classes.
- `--registry DIR`: a string containing a path to a directory containing a **gypsum**-like organization of files.
  This is equivalent to the Gobbler's registry.
- `--gypsum URL`: a string containing the URL to a **gypsum** REST API.
  Ignored if `--registry` is provided.
- `--dir DIR`: a string containing a path to an output directory for the SQLite files.

### Creating new files

The [`fresh.js`](scripts/fresh.js) script will generate one SQLite file corresponding to each JSON schema.
This is done by listing all non-probational project-asset-versions in the **gypsum** backend,
extracting metadata documents for each class,
and inserting the metadata into the class-specific SQLite file.

```shell
./scripts/fresh.js --class BASENAME,DBNAME --gypsum URL --dir DIR
```

If the location specified in `--dir` does not exist, it will be created.
Any existing SQLite files in `--dir` will be overwritten by the new files as specified in `--class`.

In addition to creating new SQLite files, `fresh.js` will also add a `modified` file containing a Unix timestamp.
This will be used by `update.js` (see below) to determine which logs to consider during updates.

### Updating files from logs

The [`update.js`](scripts/update.js) script will modify each SQLite file based on recent changes in the **gypsum** backend.
It does so by scanning the logs in the backend, filtering for those generated after the `modified` timestamp.
Each log may be used to perform an update to the SQLite file based on its action type (see [here](https://github.com/ArtifactDB/gypsum-worker#parsing-logs)),
either by inserting rows corresponding to new objects or (more rarely) by deleting rows corresponding to deleted assets, versions or projects.

```shell
./scripts/update.js --class BASENAME,DBNAME --gypsum URL --dir DIR
```

It is assumed that the location specified in `--dir` already contains the SQLite files named by `--class`,
as `update.js` should be run on indices after their creation by `fresh.js`.

In addition to modifying the SQLite files, `update.js` will update the `modified` file to the timestamp of the last log.

### Manual reset

The [`manual.js`](scripts/manual.js) script will reset the records for a specified project/asset/version in a SQLite file.
This is intended for manual patches to specific entries, e.g., if `update.js` overlooks some changes in the backend.

```shell
./scripts/manual.js --class BASENAME,DBNAME --gypsum URL --dir DIR \
    --project PROJECT 

./scripts/manual.js --class BASENAME,DBNAME --gypsum URL --dir DIR \
    --project PROJECT --asset ASSET

./scripts/manual.js --class BASENAME,DBNAME --gypsum URL --dir DIR \
    --project PROJECT --asset ASSET -- version VERSION
```

This script has the following additional options:

- `--project PROJECT`: string containing the name of the project.
  This is a required argument.
- `--asset ASSET`: string containing the name of the asset inside the project.
  This is an optional argument.
- `--version VERSION`: string containing the name of the version of the asset.
  Optional and ignored if `--asset` is not provided.

If only `--project` is specified, the entire project is reindexed in each SQLite file.
This involves deleting all related records in all tables, then repopulating them after pulling metadata from on the backend.
If `--asset` is specified, the reindexing is limited to the named asset,
while if `--version` is also specified, the reindexing is further limited to the named version.

## Links

The [**gypsum** documentation](https://github.com/ArtifactDB/gypsum-worker) describes the expected file organization in the **gypsum** bucket.
The same organization is used in the [Gobbler's documentation](https://github.com/ArtifactDB/gobbler) for an on-premise alternative.

The [**bioconductor-metadata-index** repository](https://github.com/ArtifactDB/bioconductor-metadata-index) uses this repository to create SQLite indices for Bioconductor packages. 
