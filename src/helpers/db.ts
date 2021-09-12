import {Pool, PoolConfig, QueryResult} from "pg";

require("dotenv").config();

const conf: PoolConfig = {
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT) || 5432,
    database: process.env.DB_NAME,
};

export const db = new Pool(conf);

interface DB_Success<T = any> {
    success: true;
    data: Pick<QueryResult<T>, "rows" | "command" | "rowCount">;
}

interface DB_Failure {
    success: false;
    message: string;
}

export type DB_Response<T = any> = DB_Success<T> | DB_Failure;

export const customQuery = async <T = any>(
    query: string,
    args?: any[]
): Promise<DB_Response<T>> => {
    try {
        const {rows, rowCount, command} = await db.query<T>(query, args || []);
        return {
            success: true,
            data: {command, rowCount, rows},
        };
    } catch (e) {
        return {
            success: false,
            message: e.message,
        };
    }
};