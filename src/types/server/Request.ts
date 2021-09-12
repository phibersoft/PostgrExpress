export interface Server_RequestPaging {
    limit?: number;
    offset?: number;
    orderby?: string;
    ordertype?: 'asc' | 'desc';
}