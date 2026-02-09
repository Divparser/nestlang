
import {ValidateNestLang, ExampleBuilder} from "./index.js";

const result = ValidateNestLang(`
products: all products in the page (array)
    name: Product name 
    -price: Product price (number)
    -description: Product description 
    -image: Product image (object)
        -url: Image URL (string)
        -width: Image width (number)
        -height: Image height (number)
        -alt: Image alt text (string)
    -inStock: Is the product in stock (boolean)

metadata: (object)
    -createdAt: Creation date (string)
    -updatedAt: Last update date (string
`);

console.log(result);

const exampleBuilder = new ExampleBuilder();

exampleBuilder.add({
    title: "Product List Example",
    nestlang: `
products: (array)
    -name: Product name 
    -price: Product price (number)
    -description: Product description 
    -image: Product image (object)
        -url: Image URL (string)
        -width: Image width (number)
        -height: Image height (number)
        -alt: Image alt text (string)
    -inStock: Is the product in stock (boolean)

metadata: (object)
    -createdAt: Creation date (string)
    -updatedAt: Last update date (string)
`,
    json: {
        products: [
            {
                name: "Sample Product",
                price: 19.99,
                description: "A sample product description.",
                image: {
                    url: "http://example.com/image.jpg",
                    width: 600,
                    height: 400,
                    alt: "Sample Image"
                },
                inStock: true
            }
        ],
        metadata: {
            createdAt: "2024-01-01T00:00:00Z",
            updatedAt: "2024-01-02T00:00:00Z"
        }
    },
    notes: [
        "This is a sample product list in NestLang format.",
        "It includes product details and metadata."
    ]
})

exampleBuilder.add({
    title: "Property Scraper Example",
    nestlang: `
    data: the first 10 properties ordered by price (array)
        -address: Property address (string)
        -price: Property price (number)
        -bedrooms: Number of bedrooms (number)
        -bathrooms: Number of bathrooms (number)
        -features: (array)
            -feature: Property feature (string)
        -agent: (object)
            -name: Agent name (string)
            -phone: Agent phone number (string)

    metadata: (object)
        -createdAt: Creation date (string)
        -updatedAt: Last update date (string)
    `,
    json: {
        data: [
            {
                address: "123 Main St, Anytown, USA",
                price: 350000,
                bedrooms: 3,
                bathrooms: 2,
                features: [
                    { feature: "Swimming Pool" },
                    { feature: "Garage" },
                    { feature: "Garden" }
                ],
                agent: {
                    name: "John Doe",
                    phone: "555-1234"
                }
            }
        ],
        metadata: {
            createdAt: "2024-02-01T00:00:00Z",
            updatedAt: "2024-02-02T00:00:00Z"
        }
    },
    notes: [
        "This example demonstrates a property listing scraper.",
        "It captures various property details and agent information."
    ]
})

const builtExamples = exampleBuilder.buildAll();

builtExamples.forEach((ex, idx) => {
    console.log(`\n--- Example ${idx + 1} ---\n`);
    console.log(ex.string);
});