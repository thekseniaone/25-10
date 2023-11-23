import supertest from "supertest";
import user from "../framework/services/user";
import config from "../framework/config/config";
import bookstore from "../framework/services/bookstore";

// проверка пользователя и авторизации
describe('user', () => {

    //Авторизация
    describe('POST /Account/v1/Authorized', () => {
        test('Метод должен существовать', async () => {
            const res = await supertest('https://bookstore.demoqa.com')
                .post('/Account/v1/Authorized')
                .send({})
            expect(res.status).not.toEqual(404)
        })

        test('Пользователь существует', async () =>{
            const res = await user.signup(config.credentialsAuthTest)
            expect(res.status == 200 || res.status == 201 || res.status == 406).toBe(true)
        })

        test('Авторизация должна проходить успешно с правильным логином и паролем', async () => {
            await user.token(config.credentialsAuthTest)
            const res = await user.login(config.credentialsAuthTest)
            expect(res.status).toEqual(200)
            expect(JSON.stringify(res.body)).toEqual("true")
        })

        test('Авторизация должна возвращать статус с кодом ошибки, если логин неверный', async () => {
            const res = await user.login({userName:'test19284982374',password: 'Test1234#'})
            expect(res.status).toEqual(404)
            expect(JSON.stringify(res.body.code)).toEqual("\"1207\"")
            expect(JSON.stringify(res.body.message)).toEqual("\"User not found!\"")
        })

        test('Авторизация должна возвращать статус с кодом ошибки, если пароль неверный', async () => {
            const res = await user.login({userName:config.credentialsAuthTest.userName,password: 'Test1234&'})
            expect(res.status).toEqual(404)
            expect(JSON.stringify(res.body.code)).toEqual("\"1207\"")
            expect(JSON.stringify(res.body.message)).toEqual("\"User not found!\"")
        })



        test.each([
            {a: config.credentials.userName, b: config.credentials.password, expected: 201},
            {a: config.credentials.userName, b: '2', expected: 400},
            {a: 'test', b: '1', expected: 400},
          ])('Параметризованный тест для создания пользователя', async ({a, b, expected}) => {
            const resUser = await user.signup({'userName' :a, 'password': b})
            expect(resUser.status).toBe(expected);
          });

    })


    //Получение информации
    describe('GET /Account/v1/User/{UUID}', ()=>{
        test('Метод должен существовать', async () => {
            const res = await supertest('https://bookstore.demoqa.com')
                .post('/Account/v1/User/{UUID}')
                .send({})
            expect(res.status).not.toEqual(404)
        })

        test('Получение информации о существующем авторизованном пользователе', async () => {
            const usernameUnique = 'testuser' + Math.floor(Math.random() * 10000000)
    
            const resCreate = await user.signup({userName: usernameUnique, password:config.credentialsAuthTest.password})
            expect(resCreate.status).toEqual(201)

            const resToken = await user.token({userName: usernameUnique, password:config.credentialsAuthTest.password})
            expect(resToken.status).toEqual(200)

            const res = await user.check(resCreate.body.userID, resToken.body.token)
            expect(res.status).toEqual(200)
            expect(res.body.userId).toEqual(resCreate.body.userID)
        })

        //смысла писать тест "Получение информации о существующем НЕавторизованном пользователе" не вижу,
        //поскольку запрос на получение информации не сработает без токена

        test('Получение информации с некорректным токеном', async () => {
            const usernameUnique = 'testuser' + Math.floor(Math.random() * 10000000)
    
            const resCreate = await user.signup({userName: usernameUnique, password:config.credentialsAuthTest.password})
            expect(resCreate.status).toEqual(201)

            const resToken = await user.token({userName: usernameUnique, password:config.credentialsAuthTest.password})
            expect(resToken.status).toEqual(200)

            const res = await user.check(resCreate.body.userID, resToken.body.token + "test")
            expect(res.status).toEqual(401)
            expect(res.body.message).toEqual('User not authorized!')
        })

        test('Получение информации с некорректным userid', async () => {
            const usernameUnique = 'testuser' + Math.floor(Math.random() * 10000000)
    
            const resCreate = await user.signup({userName: usernameUnique, password:config.credentialsAuthTest.password})
            expect(resCreate.status).toEqual(201)

            const resToken = await user.token({userName: usernameUnique, password:config.credentialsAuthTest.password})
            expect(resToken.status).toEqual(200)

            const res = await user.check(resCreate.body.userID + '-test', resToken.body.token)
            expect(res.status).toEqual(401)
            expect(res.body.message).toEqual('User not found!')
        })
    })

    //Удаление пользователя
    describe('DELETE /Account/v1/User/{UUID}', ()=>{
        test('Метод должен существовать', async () => {
            const res = await supertest('https://bookstore.demoqa.com')
                .post('/Account/v1/User/{UUID}')
                .send({})
            expect(res.status).not.toEqual(404)
        })


        test('Удаление существующего пользователя', async () => {
            const usernameUnique = 'testuser' + Math.floor(Math.random() * 10000000)
    
            const resCreate = await user.signup({userName: usernameUnique, password:config.credentialsAuthTest.password})
            expect(resCreate.status).toEqual(201)

            const resToken = await user.token({userName: usernameUnique, password:config.credentialsAuthTest.password})
            expect(resToken.status).toEqual(200)

            const res = await user.delete(resCreate.body.userID, resToken.body.token)
            expect(res.status).toEqual(204)

            const resCheckAfterDelete = await user.check(resCreate.body.userID, resToken.body.token)
            expect(resCheckAfterDelete.body.message).toEqual("User not found!")

        })

        test('Удаление несуществующего пользователя, неправильный UUID', async () => {
            const usernameUnique = 'testuser' + Math.floor(Math.random() * 10000000)
    
            const resCreate = await user.signup({userName: usernameUnique, password:config.credentialsAuthTest.password})
            expect(resCreate.status).toEqual(201)

            const resToken = await user.token({userName: usernameUnique, password:config.credentialsAuthTest.password})
            expect(resToken.status).toEqual(200)
            
            const res = await user.delete(resCreate.body.userID + "test", resToken.body.token)
            expect(res.body.code).toEqual("1207")
            expect(res.body.message).toEqual("User Id not correct!")
        })

        test('Удаление существующего пользователя с неправильным токеном', async () => {
            const usernameUnique = 'testuser' + Math.floor(Math.random() * 10000000)
    
            const resCreate = await user.signup({userName: usernameUnique, password:config.credentialsAuthTest.password})
            expect(resCreate.status).toEqual(201)

            const resToken = await user.token({userName: usernameUnique, password:config.credentialsAuthTest.password})
            expect(resToken.status).toEqual(200)

            const res = await user.delete(resCreate.body.userID, resToken.body.token + "test")
            expect(res.body.code).toEqual("1200")
            expect(res.body.message).toEqual("User not authorized!")

        })

    })
    
})

describe('bookstore', () => {

    //Создание
    describe('POST /BookStore/v1/Books', () => {
        test('Успешное создание книги', async () => {

            //авторизация пользователя
            const userId = (await user.signup(config.credentials)).body.userID
            const token = (await user.token(config.credentials)).body.token
            const resUser = await user.login(config.credentials)
            expect(resUser.status).toEqual(200)

            //получение списка книг
            const resBookList = await bookstore.getList()
            const isbn = resBookList.body.books[Math.floor(Math.random() * resBookList.body.books.length)].isbn;  

            //создание книги
            const resBookCreate = await bookstore.create({userId:`${userId}`, collectionOfIsbns:[{isbn: `${isbn}`}]}, token)
            expect(resBookCreate.status).toBe(201)
            expect(resBookCreate.body).toHaveProperty('books')

            await user.delete(userId, token)
        })


        test('Создание книги с некорректным токеном', async () => {

            //авторизация пользователя
            const userId = (await user.signup(config.credentials)).body.userID
            const token = (await user.token(config.credentials)).body.token
            const resUser = await user.login(config.credentials)
            expect(resUser.status).toEqual(200)

            //получение списка книг
            const resBookList = await bookstore.getList()
            const isbn = resBookList.body.books[Math.floor(Math.random() * resBookList.body.books.length)].isbn;  

            //создание книги
            const resBookCreate = await bookstore.create({userId:`${userId}`, collectionOfIsbns:[{isbn: `${isbn}`}]}, token + '2')
            expect(resBookCreate.status).toBe(401)
            expect(resBookCreate.body.code).toBe('1200')
            expect(resBookCreate.body.message).toBe('User not authorized!')

            await user.delete(userId, token)

        })

        test('Cоздание книги c некорректным userID', async () => {

            //авторизация пользователя
            const userId = (await user.signup(config.credentials)).body.userID
            const token = (await user.token(config.credentials)).body.token
            const resUser = await user.login(config.credentials)
            expect(resUser.status).toEqual(200)

            //получение списка книг
            const resBookList = await bookstore.getList()
            const isbn = resBookList.body.books[Math.floor(Math.random() * resBookList.body.books.length)].isbn;  

            //создание книги
            const resBookCreate = await bookstore.create({userId: config.credentials.userName, collectionOfIsbns:[{isbn: `${isbn}`}]}, token)
            expect(resBookCreate.status).toBe(401)
            expect(resBookCreate.body.code).toBe('1207')
            expect(resBookCreate.body.message).toBe('User Id not correct!')

            await user.delete(userId, token)

        })

        
    })

    //Обновление
    describe('PUT /BookStore/v1/Books', () => {
        test('Успешное обновление книги', async () => {

            //авторизация пользователя
            const userId = (await user.signup(config.credentials)).body.userID
            const token = (await user.token(config.credentials)).body.token
            const resUser = await user.login(config.credentials)
            expect(resUser.status).toEqual(200)

            //получение списка книг
            const resBookList = await bookstore.getList()
            const isbn = resBookList.body.books[Math.floor(Math.random() * resBookList.body.books.length)].isbn;  
            let isbn2
            do {
                isbn2 = resBookList.body.books[Math.floor(Math.random() * resBookList.body.books.length)].isbn
            } while (isbn2 == isbn)
            //по какой-то причине этот запрос срабатывает только в том случае, если isbn в урле и запросе не совпадают. Описания нигде нет

            //добавление книги в коллекцию
            const resBookCreate = await bookstore.create({userId:`${userId}`, collectionOfIsbns:[{isbn: `${isbn}`}]}, token)
            expect(resBookCreate.status).toBe(201)
            expect(resBookCreate.body).toHaveProperty('books')

            //обновление книги
            const resBookUpdate = await bookstore.update({userId:`${userId}`, isbn:`${isbn2}`}, isbn, btoa(`${config.credentials.userName}:${config.credentials.password}`))
            expect(resBookUpdate.status).toBe(200)
            expect(resBookUpdate.body).toHaveProperty('books')

            await user.delete(userId, token)
        })

        test('Обновление книги без авторизации', async () => {

            //авторизация пользователя
            const userId = (await user.signup(config.credentials)).body.userID
            const token = (await user.token(config.credentials)).body.token
            const resUser = await user.login(config.credentials)
            expect(resUser.status).toEqual(200)

            //получение списка книг
            const resBookList = await bookstore.getList()
            const isbn = resBookList.body.books[Math.floor(Math.random() * resBookList.body.books.length)].isbn;  
            let isbn2
            do {
                isbn2 = resBookList.body.books[Math.floor(Math.random() * resBookList.body.books.length)].isbn
            } while (isbn2 == isbn)
            //по какой-то причине этот запрос срабатывает только в том случае, если isbn в урле и запросе не совпадают. Описания нигде нет

            //добавление книги в коллекцию
            const resBookCreate = await bookstore.create({userId:`${userId}`, collectionOfIsbns:[{isbn: `${isbn}`}]}, token)
            expect(resBookCreate.status).toBe(201)
            expect(resBookCreate.body).toHaveProperty('books')

            //обновление книги
            const resBookUpdate = await bookstore.update({userId:`${userId}`, isbn:`${isbn2}`}, isbn, btoa(`${config.credentials.userName}:${config.credentials.password} + '234'`))
            expect(resBookUpdate.status).toBe(401)
            expect(resBookUpdate.body.code).toBe('1200')
            expect(resBookUpdate.body.message).toBe('User not authorized!')

            await user.delete(userId, token)
        })

        test('Обновление книги без добавления в коллекцию', async () => {

            //авторизация пользователя
            const userId = (await user.signup(config.credentials)).body.userID
            const token = (await user.token(config.credentials)).body.token
            const resUser = await user.login(config.credentials)
            expect(resUser.status).toEqual(200)

            //получение списка книг
            const resBookList = await bookstore.getList()
            const isbn = resBookList.body.books[Math.floor(Math.random() * resBookList.body.books.length)].isbn;  
            let isbn2
            do {
                isbn2 = resBookList.body.books[Math.floor(Math.random() * resBookList.body.books.length)].isbn
            } while (isbn2 == isbn)
            //по какой-то причине этот запрос срабатывает только в том случае, если isbn в урле и запросе не совпадают. Описания нигде нет

            //добавление книги в коллекцию
            const resBookCreate = await bookstore.create({userId:`${userId}`, collectionOfIsbns:[{isbn: `${isbn}`}]}, token)
            expect(resBookCreate.status).toBe(201)
            expect(resBookCreate.body).toHaveProperty('books')

            //обновление книги
            const resBookUpdate = await bookstore.update({userId:`${userId}`, isbn:`${isbn}`}, isbn, btoa(`${config.credentials.userName}:${config.credentials.password}`))
            expect(resBookUpdate.status).toBe(400)
            expect(resBookUpdate.body.code).toBe('1206')
            expect(resBookUpdate.body.message).toBe('ISBN supplied is not available in User\'s Collection!')

            await user.delete(userId, token)
        })
        
    })    

    describe('GET /BookStore/v1/Books', () => {
        test('Запрос на получение информации о книге c существующим ISBN', async () => {

            //получение списка книг
            const resBookList = await bookstore.getList()
            const isbn = resBookList.body.books[Math.floor(Math.random() * resBookList.body.books.length)].isbn;  
           
            const resBookInfo = await bookstore.check(isbn);

            expect(resBookInfo.status).toBe(200)
            expect(resBookInfo.body).toHaveProperty('title')
            expect(resBookInfo.body.isbn).toBe(isbn)

        })


        test('Запрос на получение информации о книге c несуществующим ISBN', async () => {

            //получение списка книг
            const isbn = Math.floor(Math.random() * 10);   
           
            const resBookInfo = await bookstore.check(isbn)   
            expect(resBookInfo.status).toBe(400)
            expect(resBookInfo.body.code).toBe('1205')
            expect(resBookInfo.body.message).toBe('ISBN supplied is not available in Books Collection!')    
        })

    })


    describe('DELETE /BookStore/v1/Books', () => {
        test('Успешное удаление существующей книги из коллекции', async () => {

            //авторизация пользователя
            const userId = (await user.signup(config.credentials)).body.userID
            const token = (await user.token(config.credentials)).body.token
            const resUser = await user.login(config.credentials)
            expect(resUser.status).toEqual(200)

            //получение списка книг
            const resBookList = await bookstore.getList()
            const isbn = resBookList.body.books[Math.floor(Math.random() * resBookList.body.books.length)].isbn;  
   
            //добавление книги в коллекцию
            const resBookCreate = await bookstore.create({userId:`${userId}`, collectionOfIsbns:[{isbn: `${isbn}`}]}, token)
            expect(resBookCreate.status).toBe(201)
            expect(resBookCreate.body).toHaveProperty('books')

            //Удаление книги из коллекции
            const resBookDelete = await bookstore.delete({isbn:`${isbn}`, userId:`${userId}`}, btoa(`${config.credentials.userName}:${config.credentials.password}`))
            expect(resBookDelete.status).toBe(204)

            await user.delete(userId, token)
        })

        test('Удаление несуществующей книги из коллекции', async () => {

            //Авторизация пользователя
            const userId = (await user.signup(config.credentials)).body.userID
            const token = (await user.token(config.credentials)).body.token
            const resUser = await user.login(config.credentials)
            expect(resUser.status).toEqual(200)

            //Генерация ISBN
            const isbn = Math.floor(Math.random() * 10);   
            
            //Удаление книги из коллекции
            const resBookDelete = await bookstore.delete({isbn:`${isbn}`, userId:`${userId}`}, btoa(`${config.credentials.userName}:${config.credentials.password}`))
            expect(resBookDelete.status).toBe(400)
            expect(resBookDelete.body.code).toBe('1206')
            expect(resBookDelete.body.message).toBe("ISBN supplied is not available in User's Collection!")    
        
            await user.delete(userId, token)
        })

        test('Удаление книги из коллекции с некорректным uuid', async () => {

            //авторизация пользователя
            const userId = (await user.signup(config.credentials)).body.userID
            const token = (await user.token(config.credentials)).body.token
            const resUser = await user.login(config.credentials)
            expect(resUser.status).toEqual(200)

            //получение списка книг
            const resBookList = await bookstore.getList()
            const isbn = resBookList.body.books[Math.floor(Math.random() * resBookList.body.books.length)].isbn;  
   
            //добавление книги в коллекцию
            const resBookCreate = await bookstore.create({userId:`${userId}`, collectionOfIsbns:[{isbn: `${isbn}`}]}, token)
            expect(resBookCreate.status).toBe(201)
            expect(resBookCreate.body).toHaveProperty('books')

            //Удаление книги из коллекции
            const resBookDelete = await bookstore.delete({isbn:`${isbn}`, userId:`${config.credentials.userName}`}, btoa(`${config.credentials.userName}:${config.credentials.password}`))
            expect(resBookDelete.status).toBe(401)
            expect(resBookDelete.body.code).toBe('1207')
            expect(resBookDelete.body.message).toBe("User Id not correct!")

            await user.delete(userId, token)
        })

        test('Удаление книги из коллекции с некорректными данными авторизации', async () => {

            //авторизация пользователя
            const userId = (await user.signup(config.credentials)).body.userID
            const token = (await user.token(config.credentials)).body.token
            const resUser = await user.login(config.credentials)
            expect(resUser.status).toEqual(200)

            //получение списка книг
            const resBookList = await bookstore.getList()
            const isbn = resBookList.body.books[Math.floor(Math.random() * resBookList.body.books.length)].isbn;  
   
            //добавление книги в коллекцию
            const resBookCreate = await bookstore.create({userId:`${userId}`, collectionOfIsbns:[{isbn: `${isbn}`}]}, token)
            expect(resBookCreate.status).toBe(201)
            expect(resBookCreate.body).toHaveProperty('books')

            //Удаление книги из коллекции
            const resBookDelete = await bookstore.delete({isbn:`${isbn}`, userId:`${userId}`}, btoa(`${config.credentials.userName}:'test'`))
            expect(resBookDelete.status).toBe(401)
            expect(resBookDelete.body.code).toBe('1200')
            expect(resBookDelete.body.message).toBe("User not authorized!")    
        
            await user.delete(userId, token)
        })


    })

})