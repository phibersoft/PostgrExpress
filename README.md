# PostgrExpress

## Description
This package generates an Rest API for PostgreSQL.

## Table of Contents
* [Required Dependencies](#required-dependencies)
* [Usage](#usage)
* [API](#api)
  * [Table Schema](#table-schema)
  * [View Schema](#view-schema)
  * [Command Schemas](#command-schemas)
    * [Select](#command-select)
    * [Insert](#command-insert)
    * [Update](#command-update)
    * [Delete](#command-delete)
  * [Field Schema](#field)
  * [Pagination](#pagination)
* [Example](#example)
  * [Insert Tables To Database](#insert-tables-to-database)
  * [Define Schemas In Typescript](#define-schemas-in-typescript)
  * [Result](#result)
* [Testing](#testing)

## <a name="required-dependencies"></a> Required Dependencies
* Node v14+
* Express (https://www.npmjs.com/package/express) // Server
* Chalk (https://www.npmjs.com/package/chalk) // Better debugging on console
* Pg (https://www.npmjs.com/package/pg) // PostgreSQL Official module
* Express-Async-Wrapper (https://www.npmjs.com/package/express-async-wrapper) // Wrapping errors to errorHandler

## <a name="usage"></a> Usage

```javascript
  // Import packages
  import * as PostgrExpress from "postgrexpress";
  import * as pg from "pg";
  import * as express from "express";
  
  const app = express();
  
  /*
   ... Your express server configurations ...
   */
  
  // Connect to your database via "pg" package
  const poolConfig = {
    host: '...',
    ...
  };
  
  const db = new pg.Pool(poolConfig);
  
  // Define your table's schema.
  const tables = [
      {
          tableName: "users",
          routeName: "users",
          primaryKey: "user_id",
          update: {
              fields: [
                  {
                      name: "username",
                      required: true,
                  },
              ],
          },
          insert: {
              fields: [
                  {
                    name: "username",
                    required: true,
                  }
             ],
          },
      },
  ];
  
  // You can define your views too. Reference API.
  
  // Define your PostgrExpress config.
  const conf = {
    database: {
        tables: schema,
        views: []
    }  
  };
  
  // Call PostgrExpress. 
  const pge = new PostgrExpress(db);
  app.use(`/api`, pge.PrepareRoute(conf));
  
  // Done.
  
```

## <a name="api"></a> API
### <a name="table-schema"></a> Table Schema
| Property        | Type           | Description | Required  |
| :-------------: |:-------------:| :-----: | :-----:|
| tableName      | string | PostgreSQL Table Name | ✅ |
| routeName | string | Route name for express | Default: tableName |
| primaryKey | string | Primary key for table | ✅ |
| update | [UpdateCommand](#command-update) | post route/:id configuration |✅ |
| insert | [InsertCommand](#command-insert) | post route/ configuration | ✅ |
| select | [SelectCommand](#command-select) | get route & get route/:id configuration | ❌ |
| delete | [DeleteCommand](#command-delete) | delete route/:id configuration | ❌ |

### <a name="view-schema"></a> View Schema
| Property        | Type           | Description | Required  |
| :-------------: |:-------------:| :-----: | :-----:|
| routeName      | string | Route name for express | ✅ |
| primaryKey | string | Primary key for table (must be with dot. "u.user_id") | ✅ |
| query | string | Actual sql query for view |✅ |
| args | any[] | Query args | ❌ |
| select | [SelectCommand](#command-select) | get route & get route/:id configuration | ❌ |

### <a name="command-schemas"></a> Command Schemas (Select, Insert, Update, Delete)

#### <a name="command-select"></a> Select
| Property        | Type           | Description | Required  |
| :-------------: |:-------------:| :-----: | :-----:|
| before      |  async (id?: number):void | Before select request | ❌ |
| after | async (data?: any[]):void | After select request | ❌ |
| columns | string[] | Select columns list | Default: "*" |

#### <a name="command-update"></a> Update
| Property | Type | Description | Required |
| :---: | :---------: | :-----: | :-----: |
| before | async (body: Object):Object | If you need to redefine body you can use this function. | ❌
| after | async (data: any[]):void | Updated columns list | ❌ |
| fields | [Field](#field)[] | Which columns will used for update | ✅ |
| idColumn | string | If you dont want to use table.primaryKey | ❌ |

#### <a name="command-insert"></a> Insert
| Property | Type | Description | Required |
| :---: | :---------: | :-----: | :-----: |
| before | async (body: Object):Object | If you need to redefine body you can use this function. | ❌ |
| after | async (data: any[]):void | Inserted columns list | ❌ |
| fields | [Field](#field)[] | Which columns will used for insert | ✅ |

#### <a name="command-delete"></a> Delete

| Property | Type | Description | Required |
| :---: | :---------: | :-----: | :-----: |
| before | async (id: number):void | Before delete request | ❌ |
| after | async (id: number):void | After deleted success | ❌ |
| idColumn | string | If you dont want to use table.primaryKey | ❌ |

### <a name="field"></a> Field

| Property | Type | Description | Required |
| :---: | :---------: | :-----: | :-----: |
| name | string | Key of object | ✅ |
| required | boolean | If this field required for insert/update | Default: false |

### <a name="pagination"></a> Pagination
Select all route uses pagination default.
Here are the querystring schema.

| Key | Type | Description | Default |
| :---: | :---: | :---: | :---: |
| limit | number | Limits result count | 100 |
| offset | number | Starts from | 0 |
| orderby | string | Order column | table.primaryKey |
| ordertype | 'ASC' or 'DESC' | Order type | 'DESC'

## <a name="example"></a> Example

#### <a name="insert-tables-to-database"></a> Insert tables to database
```sql
    CREATE TABLE users(
       user_id integer SERIAL PRIMARY KEY,
       username varchar(100)
    );
    
    CREATE TABLE comments(
       comment_id integer SERIAL PRIMARY KEY,
       user_id integer,
       content varchar(500),
       data json
    );
```

#### <a name="define-schemas-in-typescript"></a> Define schemas in typescript

```typescript
  // Define fields for insert/update operations.
import PostgrExpress from "./PostgrExpress";

const userFields = [
    {
        name: 'username',
        required: true,
    }
];
const commentFields = [
    {
        name: 'content',
        required: true,
    },
    {
        name: 'user_id',
        required: true,
    }
];

// Define database config for PostgrExpress.
const schema = {
    tables: [
        {
            tableName: 'users',
            primaryKey: 'user_id',
            update: {
                fields: userFields,
                async after(updatedRows) {
                    // You can do any stuff with updatedRows.
                    console.log(`Updated row count: ${updatedRows}`);
                },
                async before(body) {
                    // You can do any editing on body.
                    // If you dont return edited body, this program will give error.
                    return body;
                }
            },
            insert: {
                fields: userFields
            }
        },
        {
            tableName: 'comments',
            routeName: 'custom_comments', // If you dont want to use /comments route.
            update: {
                fields: commentFields,
            },
            insert: {
                fields: commentFields
            }
        }
    ],
    views: [
        {
            routeName: "user_comments",
            primaryKey: "u.user_id",
            query: `SELECT * FROM users u INNER JOIN comments c ON u.user_id = c.user_id `,
            args: [],
        },
    ]
};

const pge = new PostgrExpress(db) // db is your Pg POOL!
const route = pge.PrepareRoute({
    database: schema,
}); // route is express.Route now.

// You can use route as any if you want.
server.use(`/api`, route);

// Done.
```

### <a name="result"></a> Result
| Method | Route | Description |
| :---: | :---: | :---: |
| GET | /api/users | Gets all users with pagination |
| GET | /api/users/1 | Gets user where "user_id" = 1 |
| POST | /api/users (content-type: application/json) | Inserts user with required key "username"
| POST | /api/users/1 (content-type: application/json) | Updates user where "user_id" = 1
| DELETE | /api/users/1 | Deletes user where "user_id" = 1 |
||||
| GET | /api/custom_comments | Gets all comments with pagination |
| GET | /api/custom_comments/1 | Gets comment where "comment_id" = 1 |
| POST | /api/custom_comments (content-type: application/json) | Inserts comment with required keys "user_id", "content"
| POST | /api/custom_comments/1 (content-type: application/json) | Updates comment where "comment_id" = 1 |
| DELETE | /api/custom_comments/1 | Deletes comment where "comment_id" = 1
||||
| GET | /api/view/user_comments | Gets user-comment join data |
| GET | /api/view/user_comments/1 | Gets user-comment join data where "user_id" = 1 | 

## <a name="testing"></a> Testing
Writed tests for body handling and key checks.