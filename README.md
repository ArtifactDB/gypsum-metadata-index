# Index gypsum metadata

[![Tests](https://github.com/ArtifactDB/stringy-sqlite-search/actions/workflows/run-tests.yaml/badge.svg)](https://github.com/ArtifactDB/stringy-sqlite-search/actions/workflows/run-tests.yaml)

## Overview 

This repository contains scripts to index metadata stored in a [**gypsum** backend](https://github.com/ArtifactDB/gypsum-worker).
Each index is a self-contained SQLite file that can be downloaded and queried without further reliance on the backend.
We construct new indices by inspecting the backend for JSON metadata documents within each project-asset-version combination;
existing indices are updated by routinely scanning the [logs](https://github.com/ArtifactDB/gypsum-worker#parsing-logs) for new content.

This document is intended for system administrators to generate new indices, or developers of packages that use the indices.
Users should not have to interact with these indices directly, as this should be mediated by client packages in relevant frameworks like R/Bioconductor.
For example, the [gypsum R client](https://github.com/ArtifactDB/gypsum-R) provides functions for downloading and caching the indices,
which are then called by more user-facing packages like the [scRNAseq](https://github.com/LTLA/scRNAseq) R package.

## Concepts

All metadata documents should be JSON-formatted and assigned to a particular project-asset-version in the **gypsum** backend.
The scripts in this repository will scrape the backend (either directly or by parsing the logs) to identify metadata documents to add to the index.

One SQLite index is generated for each "class" of metadata documents.
All documents in the same class should have the same base name, i.e., after removing the `/` prefix in the full bucket path. 
Each metadata class typically corresponds to a specific [JSON schema](https://json-schema.org) used to validate its documents;
this suggests that the documents are comparable with similar structure and values.

Metadata documents are stored in the SQLite file as a [JSONB](https://sqlite.org/jsonb.html) column.
This can be converted back to JSON-formatted text by using `json_extract(metadata)` in the `SELECT` queries.

To enable efficient text search, string properties in the metadata document are converted into (field, token) pairs for indexing.
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

To obtain tokens, each string is converted to lower case and split into contiguous stretches of ASCII alphanumeric characters or dashes.
Each stretch is defined as a token and indexed with the property's field name. 
It is expected that queries will use the same tokenization scheme for their text searches.

## SQLite file contents

### `versions` table

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
- `vid`: integer, the version ID from `versions`, representing the project-asset-version containing the metadata file.
- `path`: text, the relative path to the directory containing the metadata file inside the project-asset-version.
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
- `field`: text, the field names.

An index is available for `field`.

### `links`

This is a table where each row corresponds to a relationship between a metadata file, the field name and token.
It contains the following columns:

- `pid`: integer, the path ID from `paths`.
- `fid`: integer, the field name ID from `fields`.
- `tid`: integer, the token ID from `tokens`.

The existence of a row indicates that a token (from `tid`) is found in a field (named as `fid`) of a metadata file (at `pid`).

A multicolumn index is available for `(tid, fid)`.

## Building indices

### Comments

The [`scripts/`](scripts/) subdirectory contains several scripts for generating and updating the SQLite files.
These expect to have a modestly recent version of Node.js (tested on 16.19.1) and required dependencies can be installed with the usual `npm install` process.
They can either be run directly:

```sh
./scripts/configure.js --db_name blah --file_name _blah.js
```

Or they can be executed via `npx`:

```sh
npx --package=stringy-sqlite-search configure
```

### Creating new files

The [`fresh.js`](scripts/fresh.js) script will generate one SQLite file corresponding to each JSON schema.
This is done by listing all projects and assets in the **gypsum** backend,
identifying the latest version of each asset,
extracting metadata for objects in the latest version,
and generating a SQLite file from the extracted metadata. 

```shell
# Older versions of Node.js may need a preceding NODE_OPTIONS='--experimental-fetch'
./scripts/fresh.js --config config.json --gypsum https://gypsum.artifactdb.com --dir build
```

The script has the following options:

- `-s`, `--schemas`: the directory containing the JSON schema files.
  Defaults to `./schemas`.
- `-o`, `--outputs`: the directory in which to store the output SQLite files.
  Each file will have the same prefix as its corresponding JSON schema.
  Defaults to `./outputs`.
- `-x`, `--only`: name of a project, indicating that indexing should only be performed for that project.
  If not supplied, indexing is performed for all projects.
  Useful for debugging specific projects.
- `-a`, `--after`: any string such that indexing is only performed for projects with names that sort after that string.
  If not supplied, indexing is performed for all projects.
  Useful for debugging a set of projects.
- `-w`, `--overwrite`: boolean that specifies whether to overwrite existing SQLite files in the output directory.
  This can be turned off and combined with `--after` to iteratively construct the full index.
  Defaults to `true`.

In addition to creating new SQLite files, `fresh.js` will also add a `modified` file containing a Unix timestamp.
This will be used by `update.js` (see below) to determine which logs to consider during updates.

### Updating files from logs

The [`update.js`](scripts/update.js) script will modify each SQLite file based on recent changes in the **gypsum** backend.
It does so by scanning the logs in the backend, filtering for those generated after the `modified` timestamp.
Each log may be used to perform an update to the SQLite file based on its action type (see [here](https://github.com/ArtifactDB/gypsum-worker#parsing-logs)),
either by inserting rows corresponding to new objects or (more rarely) by deleting rows corresponding to deleted assets, versions or projects.
The `add-version` and `delete-version` actions will only have an effect if the affected version is the latest;
for `delete-version`, the script will insert metadata for objects in the currently-latest version into the SQLite file.

```shell
# Older versions of Node.js may need --experimental-fetch.
node scripts/update.js -s SCHEMAS -d DIR
```

The script has the following options:

- `-s`, `--schemas`: the directory containing the JSON schema files.
  Defaults to `./schemas`.
- `-d`, `--dir`: the directory containing the SQLite files to be modified.
  Each file will have the same prefix as its corresponding JSON schema.
  Defaults to the working directory.

In addition to modifying the SQLite files, `update.js` will update the `modified` file to the timestamp of the last log.

### Manual updates

The [`manual.js`](scripts/manual.js) script will modify each SQLite file based on its arguments.
It uses the same logic as `update.js` and is intended for testing/debugging the update code.
Any updates to SQLite files in production should still be performed by `update.js`.

```shell
# Older versions of Node.js may need --experimental-fetch.
node scripts/manual.js -t add-version -p PROJECT -a ASSET -v VERSION -l true
node scripts/manual.js -t delete-version -p PROJECT -a ASSET -v VERSION -l true
node scripts/manual.js -t delete-asset -p PROJECT -a ASSET
node scripts/manual.js -t delete-project -p PROJECT -a ASSET
```

The script has the following options:

- `-s`, `--schemas`: the directory containing the JSON schema files.
  Defaults to `./schemas`.
- `-d`, `--dir`: the directory containing the SQLite files to be modified.
  Each file will have the same prefix as its corresponding JSON schema.
  Defaults to the working directory.
- `-t`, `--type`: the type of action to perform.
  This is a required argument and should be one of `add-version`, `delete-version`, `delete-asset` or `delete-project`.
- `-p`, `--project`: the name of the project.
  This is a required argument.
- `-a`, `--asset`: the name of the project.
  This is a required argument for all `type` except for `delete-project`.
- `-v`, `--version`: the name of the project.
  This is a required argument for `add-version` and `delete-version`.
- `-l`, `--latest`: boolean indicating whether the specified version is the latest of its asset.
  This is a required argument for `add-version` and `delete-version`.




