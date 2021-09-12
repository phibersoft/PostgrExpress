import { Request } from "express";
import { Server_RequestPaging } from "../types";

export default class Paging {
  static PreparePaging = (query: any): Server_RequestPaging => {
    return {
      limit: Number(query.limit) || 100,
      offset: Number(query.offset) || 0,
      orderby: query.orderby || "",
      ordertype: query.ordertype || "desc",
    };
  };

  static PreparePagingQuery = (opts: Server_RequestPaging) => {
    return `ORDER BY "${opts.orderby}" ${opts.ordertype} LIMIT ${opts.limit} OFFSET ${opts.offset}`;
  };
}