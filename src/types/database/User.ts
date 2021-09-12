/**
 CREATE TABLE users {
    user_id integer PRIMARY KEY AUTO INCREMENT,
    username varchar(30)
 }
 */

export interface DB_User {
    user_id: number;
    username: string;
}

