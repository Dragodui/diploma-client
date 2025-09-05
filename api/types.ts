// Auth types
export interface LoginRequest {
    email: string;
    password: string;
}

export interface RegisterRequest {
      email: string;
    password: string;
    name: string;
}

export interface LoginResponse {
    token: string;
}

// Homes types
export interface User {
    id: string;
    email: string;
    name: string;
}

export interface Membership {
    id: number;
    user_id: string;
    role: string;
    user: User;
}

export interface Home {
    id: number;
    name: string;
    invite_code: string;
    memberships?: Membership[];
    // TODO: implement others relations like: rooms/tasks and so on
}
