import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";

const API_BASE_URL = "http://localhost:8000";

export const api = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem("auth_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      await AsyncStorage.removeItem("auth_token");
    }
    return Promise.reject(error);
  }
);

export interface User {
  id: string;
  email: string;
  name: string;
}

export interface Home {
  id: string;
  name: string;
  invite_code?: string;
  members?: User[];
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  room_id: string;
  frequency: string;
  assigned_to?: User;
  next_due?: string;
}

export interface Assignment {
  id: string;
  task: Task;
  user: User;
  due_date: string;
  completed: boolean;
}

export interface Bill {
  id: string;
  title: string;
  amount: number;
  due_date: string;
  payed: boolean;
  home_id: string;
}

export interface ShoppingCategory {
  id: string;
  name: string;
  home_id: string;
}

export interface ShoppingItem {
  id: string;
  name: string;
  quantity?: number;
  category_id: string;
  bought: boolean;
}

export const authApi = {
  register: (email: string, password: string, name: string) =>
    api.post("/auth/register", { email, password, name }),
  
  login: async (email: string, password: string) => {
    const response = await api.post<{ token: string, user: User }>("/auth/login", { email, password });
    if (response.data.token) {
      await AsyncStorage.setItem("auth_token", response.data.token);
    }
    return response.data;
  },
  
  logout: async () => {
    await AsyncStorage.removeItem("auth_token");
  },
};

export const homeApi = {
  createHome: (name: string) => api.post<{ message: string }>("/homes/create", { name }),
  
  getUserHome: () => api.get<Home>("/homes/my"),
  
  joinHome: (code: string) => api.post<{ message: string }>("/homes/join", { code }),
  
  leaveHome: () => api.post<{ message: string }>("/homes/leave"),
  
  regenerateInviteCode: (homeId: string) =>
    api.post<{ message: string }>(`/homes/${homeId}/invite`),
};

export const taskApi = {
  getHomeTasks: (homeId: string) => api.get<Task[]>(`/homes/${homeId}/tasks`),
  
  getUserAssignments: (userId: string) => api.get<Assignment[]>(`/users/${userId}/assignments`),
  
  completeAssignment: (assignmentId: string) =>
    api.post<{ message: string }>("/tasks/assignment/complete", { assignment_id: assignmentId }),
};

export const billApi = {
  getHomeBills: (homeId: string) => api.get<Bill[]>(`/homes/${homeId}/bills`),
  
  markBillPayed: (billId: string) => api.patch<{ message: string }>(`/bills/${billId}/mark-payed`),
};

export const shoppingApi = {
  getCategories: (homeId: string) =>
    api.get<ShoppingCategory[]>(`/homes/${homeId}/shopping/categories`),
  
  getCategoryItems: (homeId: string, categoryId: string) =>
    api.get<ShoppingItem[]>(`/homes/${homeId}/shopping/categories/${categoryId}/items`),
  
  markItemBought: (homeId: string, itemId: string) =>
    api.patch<{ message: string }>(`/homes/${homeId}/shopping/items/${itemId}/mark-bought`),
  
  createItem: (homeId: string, name: string, categoryId: string, quantity?: number) =>
    api.post<{ message: string }>(`/homes/${homeId}/shopping/items`, {
      name,
      category_id: categoryId,
      quantity,
    }),
};
