import { faker } from '@faker-js/faker';

const config = {
    url: 'https://bookstore.demoqa.com',
    credentials: {
        userName: faker.internet.userName(),
        password: 'Test123#',
    },
    credentialsAuthTest: {
        userName: faker.internet.userName(),
        password: 'Test123#1',
    },
    credentialsParameterized:{
        userName: faker.internet.userName(),
        password: 'Test123#2',
    }

}

export default config;