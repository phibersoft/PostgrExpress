import PostgrExpress from "../classes/PostgrExpress";
import {Pool} from "pg";
import {PostgrExpressField} from "../types/postgrexpress";

describe('Body Handlers for PostgrExpress', function () {
    const pge = new PostgrExpress(new Pool());
    const body = {
        name: 'Adem',
        username: 'phiber'
    };

    const fields:PostgrExpressField[] = [
        {
            name: 'name',
            required: true,
        },
        {
            name: 'username',
            required: false,
        }
    ];

    test('Insert Handler', () => {
        expect(pge.insertHandler(body, fields)).toEqual({
            query: `("name","username") VALUES ($1,$2)`,
            args: [body["name"], body["username"]]
        });

        body.name = null;

        expect(() => pge.insertHandler(body, fields)).toThrowError('Object must have this key: name');
    });

    test('Update Handler', () => {
        body.name = 'Phiber';

        expect(pge.updateHandler(body, fields)).toEqual({
            query: ` "name" = $1,"username" = $2 `,
            args: [body["name"], body["username"]]
        });

        body.name = null;
        body['flag'] = 'TR';

        expect(() => pge.updateHandler(body, fields)).toThrowError('Object must have this key: name');
        body.name = "Adem";
        expect(pge.updateHandler(body, fields)).toEqual({
            query: ` "name" = $1,"username" = $2 `,
            args: [body["name"], body["username"]]
        });
    });
});