import supertest from "supertest";

import config from "../config/config";
const {url} = config;

// контроллер Bookstore
const bookstore = {

    //Получение списка книг
    getList:()=>{
        return supertest(url)
        .get('/BookStore/v1/Books')
        .set('Accept', 'application/json')
    },

    //Создание книги
    create:(payload, token)=>{
        return supertest(url)
        .post('/BookStore/v1/Books')
        .set('Accept', 'application/json')
        .set('Authorization', 'Bearer ' + token)
        .send(payload)
    },

    //Обновление книги
    update:(payload, isbn, credentials)=>{
        return supertest(url)
        .put('/BookStore/v1/Books/' + isbn)
        .set('Accept', 'application/json')
        .set('Authorization', 'Basic ' + credentials)
        .send(payload)
    },

    //Получение информации о книге
    check:(isbn)=>{
        return supertest(url)
        .get('/BookStore/v1/Book?ISBN=' + isbn) 
        .set('Accept', 'application/json')
    },

    //Удаление книги
    delete:(payload, credentials)=>{
        return supertest(url)
        .delete('/BookStore/v1/Book')
        .set('Accept', 'application/json')
        .set('Authorization', 'Basic ' + credentials)
        .send(payload)
    }
}

export default bookstore