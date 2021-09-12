import { Pool } from "pg";
import { RequestHandler, Router } from "express";
import {
  PostgrExpressClass,
  PostgrExpressConfig,
  PostgrExpressField,
  PostgrExpressTableConfig, PostgrExpressViewConfig,
} from "../types/postgrexpress";
import { DB_Response } from "../helpers/db";
import { Server_Response } from "../types";
import Paging from "./Paging";
import CERROR from "./CERROR";
import * as chalk from "chalk";

const wrapper = require("express-async-wrapper");

export default class PostgrExpress implements PostgrExpressClass {
  db: Pool;

  constructor(db: Pool) {
    this.db = db;
  }

  static objectChecker = (obj: Object, requireds: string[]) => {
    if (obj) {
      const keys = Object.keys(obj);
      for (var i = 0; i < requireds.length; i++) {
        if (keys.includes(requireds[i]) === false) {
          throw new CERROR(`Object must have this key: ${requireds[i]}`, 400);
        } else {
          if (obj[requireds[i]] == null || obj[requireds[i]] == "") {
            throw new CERROR(
              `Value is not valid: ${requireds[i]} = ${obj[requireds[i]]}`,
              400
            );
          }
        }
      }

      return true;
    }

    throw new CERROR(
      `Object is not valid. Request.body must be includes ${requireds.join(
        ","
      )}`,
      400
    );
  };

  static objectEqualizer = (
    obj: Object,
    fields: PostgrExpressField[]
  ): Object => {
    if (!obj) {
      throw new CERROR(
        `Object is not valid. Request.body must be includes one of these ${fields
          .map((f) => f.name)
          .join(",")}`,
        400
      );
    }
    const keys = Object.keys(obj);
    const actual_field_keys = fields.map((f) => f.name);
    let wR = {};

    for (var i = 0; i < actual_field_keys.length; i++) {
      if (keys.includes(actual_field_keys[i]) && obj[actual_field_keys[i]]) {
        wR[actual_field_keys[i]] = obj[actual_field_keys[i]];
      }
    }

    return wR;
  };

  PrepareRoute(conf: PostgrExpressConfig): Router {
    const router = Router();
    var i = 0;
    for (i = 0; i < conf.database.tables.length; i++) {
      const table = conf.database.tables[i];
      const routeBase = `/${table.routeName || table.tableName}`;
      router.get(routeBase, wrapper(this._select(table)));
      router.get(`${routeBase}/:id`, wrapper(this._selectSingle(table)));
      router.post(routeBase, wrapper(this._insert(table)));
      router.post(`${routeBase}/:id`, wrapper(this._update(table)));
      router.delete(`${routeBase}/:id`, wrapper(this._delete(table)));
    }

    if(conf.database.views){
      for(i = 0; i < conf.database.views.length; i++){
        const view = conf.database.views[i];
        const routeBase = `/view/${view.routeName}`;

        router.get(routeBase, wrapper(this._view(view)));
        router.get(`${routeBase}/:id`, wrapper(this._view(view)));
      }
    }

    return router;
  }

  _select(conf: PostgrExpressTableConfig): RequestHandler {
    return async (req, res) => {
      if (conf.select?.before) {
        await conf.select.before(null);
      }

      const paging = Paging.PreparePaging(req.query);
      paging.orderby = paging.orderby || conf.primaryKey;

      const query = `SELECT * FROM ${
        conf.tableName
      } ${Paging.PreparePagingQuery(paging)}`;
      const results = await this.customQuery(query, []);

      if (
        results.success === true &&
        results.data.rows.length !== 0 &&
        conf.select?.after
      ) {
        await conf.select.after(results.data.rows);
      }

      return res.json({ ...results } as Server_Response);
    };
  }

  _selectSingle(conf: PostgrExpressTableConfig): RequestHandler {
    return async (req, res) => {
      // route/<tableName>/:id
      const { id } = req.params;
      if (id) {
        if (conf.select?.before) {
          await conf.select.before(id);
        }
        const query = `SELECT * FROM ${conf.tableName} WHERE "${conf.primaryKey}" = $1`;
        const args = [id];

        const results = await this.customQuery(query, args);

        if (results.success === true && results.data.rowCount === 0) {
          throw new CERROR(
            `No data found with this condition. "${conf.primaryKey}" = '${id}'`, 404
          );
        }

        if (
          results.success === true &&
          results.data.rows.length !== 0 &&
          conf.select?.after
        ) {
          await conf.select.after(results.data.rows);
        }

        return res.json(results as Server_Response);
      }

      throw new CERROR(`Required param is not defined: 'id'`);
    };
  }

  _insert(conf: PostgrExpressTableConfig): RequestHandler {
    return async (req, res) => {
      var _body = req.body;

      if (req.body && conf.insert.before) {
        _body = await conf.insert.before(_body);
      }

      const handledBody = this.insertHandler(_body, conf.insert.fields);
      const query = `INSERT INTO ${conf.tableName}${handledBody.query} RETURNING *`;

      const results = await this.customQuery(query, handledBody.args);

      if (
        results.success === true &&
        results.data.rows.length !== 0 &&
        conf.insert.after
      ) {
        await conf.insert.after(results.data.rows[0]);
      }

      return res.json(results as Server_Response);
    };
  }

  _delete(conf: PostgrExpressTableConfig): RequestHandler {
    return async (req, res) => {
      const { id } = req.params;
      if (!id) {
        throw new CERROR(`Required param is not defined: id`, 400);
      }

      if (conf.delete?.before) {
        await conf.delete.before(id);
      }

      const query = `DELETE FROM ${conf.tableName} WHERE ${
        conf.delete?.idColumn || conf.primaryKey
      } = ${id}`;
      const results = await this.customQuery(query, []);

      if (
        results.success === true &&
        results.data.rowCount !== 0 &&
        conf.delete?.after
      ) {
        await conf.delete.after(id);
      }

      return res.json(results as Server_Response);
    };
  }

  _update(conf: PostgrExpressTableConfig): RequestHandler {
    return async (req, res) => {
      var _body = req.body;
      if (req.body && conf.update.before) {
        _body = await conf.update.before(req.body);
      }

      const { id } = req.params;
      if (!id) {
        throw new CERROR(`Required param is not defined: id`, 400);
      }

      const handledBody = this.updateHandler(_body, conf.update.fields);
      const query = `UPDATE ${conf.tableName} SET ${handledBody.query} WHERE "${
        conf.update.idColumn || conf.primaryKey
      }" = ${typeof id === 'number' ? id : `'${id}'`} RETURNING *`;

      const results = await this.customQuery(query, handledBody.args);

      if (
        results.success === true &&
        results.data.rows.length !== 0 &&
        conf.update.after
      ) {
        await conf.update.after(results.data.rows);
      }

      return res.json(results as Server_Response);
    };
  }

  _view(conf: PostgrExpressViewConfig): RequestHandler{
    return async (req, res) => {
      const {id} = req.params;

      if(conf.select?.before){
        await conf.select.before(id);
      }

      var _query = conf.query;

      if(id){
        const splt = conf.primaryKey.split(".");
        var _primaryKey = `${splt[0]}."${splt[1]}"`;
        if(_query.includes('WHERE')){
          _query += `  AND ${_primaryKey} = ${id}`;
        } else{
          _query += ` WHERE ${_primaryKey} = ${id}`;
        }
      }

      const results = await this.customQuery(_query, conf.args || []);

      if(results.success === true && conf.select?.after){
        await conf.select.after(results.data.rows);
      }

      return res.json(results as Server_Response);
    }
  }

  async customQuery<T = any>(
    query: string,
    args?: any[]
  ): Promise<DB_Response<T>> {
    try {
      console.log(
        chalk.yellowBright(
          `${query} ${
            args && args.length !== 0 ? ` --> ${args.join(",")}` : ""
          }`
        )
      );
      const { rows, rowCount, command } = await this.db.query<T>(
        query,
        args || []
      );
      return {
        success: true,
        data: { command, rowCount, rows },
      };
    } catch (e) {
      return {
        success: false,
        message: e.message,
      };
    }
  }

  insertHandler(body: Object, fields: PostgrExpressField[]) {
    // Equalizing Object
    const _body = PostgrExpress.objectEqualizer(body, fields);

    // Checking keys
    const requireds = fields.filter((f) => f.required).map((m) => m.name);
    PostgrExpress.objectChecker(_body, requireds);

    // Generating query string
    const keys = Object.keys(_body);
    const columns = [],
      rows = [];
    for (var i = 0; i < keys.length; i++) {
      if (_body[keys[i]]) {
        columns.push(`"${keys[i]}"`);
        rows.push(_body[keys[i]]);
      }
    }
    // Generating dollar signs
    const dollarSigns = rows.map((r, i) => `$${i + 1}`);

    return {
      query: `(${columns.join(",")}) VALUES (${dollarSigns.join(",")})`,
      args: rows,
    };
  }

  updateHandler(body: Object, fields: PostgrExpressField[]) {
    // Equalizing Object
    const _body = PostgrExpress.objectEqualizer(body, fields);

    // Checking Keys
    const requireds = fields.filter((f) => f.required).map((m) => m.name);
    PostgrExpress.objectChecker(_body, requireds);

    // Generating query string
    const keys = Object.keys(_body);
    const matches = [],
      args = [];

    for (var i = 0; i < keys.length; i++) {
      matches.push(`"${keys[i]}" = $${i + 1}`);
      args.push(_body[keys[i]]);
    }

    return {
      query: ` ${matches.join(",")} `,
      args,
    };
  }
}
