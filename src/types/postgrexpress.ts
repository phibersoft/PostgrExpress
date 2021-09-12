import {Pool} from "pg";
import {RequestHandler, Router} from "express";
import {DB_Response} from "../helpers/db";

export interface PostgrExpressField {
    name: string,
    required?: boolean;
}

interface PostgrExpressCommandRoot<T = any> {
    before?: (data: T) => (T | Promise<T>),
    after?: (data: T) => void | Promise<void>;
}

interface PostgrExpressSelect<T = any> extends PostgrExpressCommandRoot<T> {
    columns?: '*' | string[];
}
interface PostgrExpressUpdate<T = any> extends PostgrExpressCommandRoot<T> {
    idColumn?: string;
    fields: PostgrExpressField[];
}

interface PostgrExpressDelete<T= any> extends PostgrExpressCommandRoot<T> {
    idColumn?: string;
}

interface PostgrExpressInsert<T = any> extends PostgrExpressCommandRoot<T> {
    fields: PostgrExpressField[];
}

export interface PostgrExpressTableConfig {
    routeName?: string;
    tableName: string,
    primaryKey: string,
    update: PostgrExpressUpdate;
    insert: PostgrExpressInsert;
    select?: PostgrExpressSelect;
    delete?: PostgrExpressDelete;
}

export interface PostgrExpressViewConfig extends Required<Pick<PostgrExpressTableConfig, "routeName" | "primaryKey">>, Pick<PostgrExpressTableConfig, "select"> {
    query: string;
    args?: any[];
}

export interface PostgrExpressConfig {
    database: {
        tables: PostgrExpressTableConfig[];
        views?: PostgrExpressViewConfig[];
    }
}

type PostgrExpressRouteFunction<T = PostgrExpressTableConfig> = (conf: T) => RequestHandler;
interface PostgrExpressBodyHandler {
    query: string;
    args?: any[];
}

export interface PostgrExpressClass {
    db: Pool;
    PrepareRoute: (conf: PostgrExpressConfig) => Router;
    _select: PostgrExpressRouteFunction;
    _selectSingle: PostgrExpressRouteFunction;
    _insert: PostgrExpressRouteFunction;
    _update: PostgrExpressRouteFunction;
    _delete: PostgrExpressRouteFunction;
    _view: PostgrExpressRouteFunction<PostgrExpressViewConfig>;

    customQuery: <T = any>(
        query: string,
        args?: any[]
    ) => Promise<DB_Response<T>>;
    insertHandler: (
        body: Object,
        fields: PostgrExpressField[]
    ) => PostgrExpressBodyHandler;
    updateHandler: (
        body: Object,
        fields: PostgrExpressField[]
    ) => PostgrExpressBodyHandler;
}
