import * as fs from "fs";
import * as path from "path";

export function setupTestDirectory(suffix) {
    const testdir = path.join("TEST", suffix);
    if (fs.existsSync(testdir)) {
        fs.rmSync(testdir, { recursive: true });
    }
    fs.mkdirSync(testdir, { recursive: true });
    return testdir;
}

export const mockMetadata = { 
    "chicken": {
        "title": "Chicken tikka masala",
        "description": "Chicken tikka masala is a dish consisting of roasted marinated chicken chunks in a spiced sauce. The sauce is usually creamy and orange-coloured.",
        "ingredients": {
            "meat": [ "chicken" ],
            "dairy": [ "yogurt", "cream" ],
            "vegetables": [ "tomato", "onion" ],
            "spices": [ "garlic", "ginger", "chili pepper"]
        },
        "variations": [ "lamb", "fish" ]
    },
    "marcille": {
        "first_name": "Marcille",
        "last_name": "Donato",
        "age": 50,
        "gender": "female",
        "likes": [ "seafood", "nuts" ],
        "dislikes": [ "weird food" ],
        "description": "Marcille is an elven mage and member of Laios' party.",
    },
    "illustrious": {
        "aircraft": 36,
        "length": 225.6,
        "beam": 29.2,
        "speed": 56,
        "complement": 1299,
        "dates": {
            "comissioned": "1940-05-25",
            "decomissioned": "1955-02"
        },
        "motto": "Vox non incerta"
    },
    "macrophage": {
        "description": "A type of white blood cell that surrounds and kills microorganisms, removes dead cells, and stimulates the action of other immune system cells.",
        "lineage": {
            "name": "monocytes",
            "from": {
                "name": "myeloid progenitor cells",
                "from": {
                    "name": "hematopoietic stem cells"
                }
            }
        },
        "friends": [ "megakaryocytes", "dendritic cells", "neutrophils" ]
    }
};
