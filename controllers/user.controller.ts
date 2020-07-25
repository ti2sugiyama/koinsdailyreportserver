import { JsonController, Param, Body, Get, Post, Put, Delete } from 'routing-controllers'

// モデルの代わりだと思って下さい。サンプル用。
type User = { name: string; age: number }
// DBの変わりだと思ってください。サンプル用。
const users = [{ name: 'hoge', age: 25 }, { name: 'fuga', age: 28 }, { name: 'piyo', age: 27 }]

@JsonController('/users')
export class UserController {
    @Get('/')
    getAll() {
        return users
    }

    @Get('/:id')
    getOne(@Param('id') id: number) {
        return users[id]
    }

    @Post('/')
    post(@Body() user: User) {
        users.push(user)
        return 'ok'
    }

    @Put('/:id')
    put(@Param('id') id: number, @Body() user: User) {
        users[id] = user
        return 'ok'
    }

    @Delete('/:id')
    remove(@Param('id') id: number) {
        users.splice(id, 1)
        return 'ok'
    }
}