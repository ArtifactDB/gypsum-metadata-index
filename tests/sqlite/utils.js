import * as fs from "fs";

export function setupTestDirectory(suffix) {
    const testdir = "TEST_" + suffix;
    if (fs.existsSync(testdir)) {
        fs.rmSync(testdir, { recursive: true });
    }
    fs.mkdirSync(testdir);
    return testdir;
}

export function mockMetadata1() {
    return {
        "title": "Chicken tikka masala",
        "description": "Chicken tikka masala is a dish consisting of roasted marinated chicken chunks in a spiced sauce. The sauce is usually creamy and orange-coloured.",
        "ingredients": {
            "meat": [ "chicken" ],
            "dairy": [ "yogurt", "cream" ],
            "vegetables": [ "tomato", "onion" ],
            "spices": [ "garlic", "ginger", "chili pepper"]
        },
        "variations": [ "lamb", "fish" ]
    };
}

export function mockMetadata2() {
    return {
        "first_name": "Marcille",
        "last_name": "Donato",
        "age": 50,
        "gender": "female",
        "likes": [ "seafood", "nuts" ],
        "dislikes": [ "weird food" ],
        "description": "Marcille is an elven mage and member of Laios' party.",
    };
}
