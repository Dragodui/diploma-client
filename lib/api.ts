import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  User,
  Home,
  Room,
  Task,
  TaskAssignment,
  Bill,
  ShoppingCategory,
  ShoppingItem,
  Poll,
  Notification,
  HomeNotification,
  AuthResponse,
  CreateTaskForm,
  CreateBillForm,
  CreatePollForm,
  CreateCategoryForm,
  CreateItemForm,
} from "./types";

const API_BASE_URL = "http://192.168.0.47:8000";

export const api = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor - add auth token
api.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem("auth_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor - handle 401
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      await AsyncStorage.removeItem("auth_token");
      await AsyncStorage.removeItem("user");
    }
    return Promise.reject(error);
  }
);

// ============ Auth API ============
export const authApi = {
  register: async (email: string, password: string, name: string) => {
    const response = await api.post("/auth/register", { email, password, name });
    return response.data;
  },

  login: async (email: string, password: string): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>("/auth/login", { email, password });
    if (response.data.token) {
      await AsyncStorage.setItem("auth_token", response.data.token);
      await AsyncStorage.setItem("user", JSON.stringify(response.data.user));
    }
    return response.data;
  },

  verifyEmail: async (token: string) => {
    const response = await api.get("/auth/verify", { params: { token } });
    return response.data;
  },

  regenerateVerify: async (email: string) => {
    const response = await api.get("/auth/verify/regenerate", { params: { email } });
    return response.data;
  },

  forgotPassword: async (email: string) => {
    const response = await api.post("/auth/forgot", null, { params: { email } });
    return response.data;
  },

  resetPassword: async (token: string, password: string) => {
    const response = await api.post("/auth/reset", null, { params: { token, password } });
    return response.data;
  },

  logout: async () => {
    await AsyncStorage.removeItem("auth_token");
    await AsyncStorage.removeItem("user");
  },
};

// ============ User API ============
export const userApi = {
  getMe: async (): Promise<User> => {
    const response = await api.post<User>("/user");
    return response.data;
  },

  update: async (data: { name?: string; avatar?: string }): Promise<User> => {
    const response = await api.patch<User>("/user", data);
    return response.data;
  },
};

// ============ Home API ============
export const homeApi = {
  create: async (name: string): Promise<Home> => {
    const response = await api.post<Home>("/homes/create", { name });
    return response.data;
  },

  getUserHome: async (): Promise<Home> => {
    const response = await api.get<{
      home: Home
    }>("/homes/my");
    return response.data.home;
  },

  getById: async (homeId: number): Promise<Home> => {
    const response = await api.get<Home>(`/homes/${homeId}`);
    return response.data;
  },

  join: async (code: string): Promise<{ message: string }> => {
    const response = await api.post<{ message: string }>("/homes/join", { code });
    return response.data;
  },

  leave: async (homeId: number): Promise<{ message: string }> => {
    const response = await api.post<{ message: string }>(`/homes/${homeId}/leave`);
    return response.data;
  },

  delete: async (homeId: number): Promise<{ message: string }> => {
    const response = await api.delete<{ message: string }>(`/homes/${homeId}`);
    return response.data;
  },

  removeMember: async (homeId: number, userId: number): Promise<{ message: string }> => {
    const response = await api.delete<{ message: string }>(`/homes/${homeId}/members/${userId}`);
    return response.data;
  },

  regenerateInviteCode: async (homeId: number): Promise<Home> => {
    const response = await api.post<Home>(`/homes/${homeId}/regenerate_code`);
    return response.data;
  },
};

// ============ Room API ============
export const roomApi = {
  create: async (homeId: number, name: string): Promise<Room> => {
    const response = await api.post<Room>(`/homes/${homeId}/rooms`, { name });
    return response.data;
  },

  getByHomeId: async (homeId: number): Promise<Room[]> => {
    const response = await api.get<Room[]>(`/homes/${homeId}/rooms`);
    return response.data;
  },

  getById: async (homeId: number, roomId: number): Promise<Room> => {
    const response = await api.get<Room>(`/homes/${homeId}/rooms/${roomId}`);
    return response.data;
  },

  delete: async (homeId: number, roomId: number): Promise<{ message: string }> => {
    const response = await api.delete<{ message: string }>(`/homes/${homeId}/rooms/${roomId}`);
    return response.data;
  },
};

// ============ Task API ============
export const taskApi = {
  create: async (homeId: number, data: CreateTaskForm): Promise<Task> => {
    const response = await api.post<Task>(`/homes/${homeId}/tasks`, data);
    return response.data;
  },

  getByHomeId: async (homeId: number): Promise<Task[]> => {
    const response = await api.get<{tasks: Task[]}>(`/homes/${homeId}/tasks`);
    return response.data.tasks;
  },

  getById: async (homeId: number, taskId: number): Promise<Task> => {
    const response = await api.get<Task>(`/homes/${homeId}/tasks/${taskId}`);
    return response.data;
  },

  delete: async (homeId: number, taskId: number): Promise<{ message: string }> => {
    const response = await api.delete<{ message: string }>(`/homes/${homeId}/tasks/${taskId}`);
    return response.data;
  },

  assignUser: async (homeId: number, taskId: number, userId: number, date: string): Promise<TaskAssignment> => {
    const response = await api.post<TaskAssignment>(`/homes/${homeId}/tasks/${taskId}/assign`, {
      task_id: taskId,
      home_id: homeId,
      user_id: userId,
      date,
    });
    return response.data;
  },

  reassignRoom: async (homeId: number, taskId: number, roomId: number): Promise<Task> => {
    const response = await api.patch<Task>(`/homes/${homeId}/tasks/${taskId}/reassign-room`, {
      task_id: taskId,
      room_id: roomId,
    });
    return response.data;
  },

  markCompleted: async (homeId: number, taskId: number): Promise<TaskAssignment> => {
    const response = await api.patch<TaskAssignment>(`/homes/${homeId}/tasks/${taskId}/mark-completed`);
    return response.data;
  },

  deleteAssignment: async (homeId: number, taskId: number, assignmentId: number): Promise<{ message: string }> => {
    const response = await api.delete<{ message: string }>(
      `/homes/${homeId}/tasks/${taskId}/assignments/${assignmentId}`
    );
    return response.data;
  },

  getUserAssignments: async (homeId: number, userId: number): Promise<TaskAssignment[]> => {
    const response = await api.get<{
      assignments: TaskAssignment[]
    }>(`/homes/${homeId}/users/${userId}/assignments`);
    return response.data.assignments;
  },

  getClosestAssignment: async (homeId: number, userId: number): Promise<TaskAssignment | null> => {
    const response = await api.get<TaskAssignment>(`/homes/${homeId}/users/${userId}/assignments/closest`);
    return response.data;
  },
};

// ============ Bill API ============
export const billApi = {
  create: async (homeId: number, data: CreateBillForm): Promise<Bill> => {
    const response = await api.post<Bill>(`/homes/${homeId}/bills`, data);
    return response.data;
  },

  getById: async (homeId: number, billId: number): Promise<Bill> => {
    const response = await api.get<Bill>(`/homes/${homeId}/bills/${billId}`);
    return response.data;
  },

  delete: async (homeId: number, billId: number): Promise<{ message: string }> => {
    const response = await api.delete<{ message: string }>(`/homes/${homeId}/bills/${billId}`);
    return response.data;
  },

  markPayed: async (homeId: number, billId: number): Promise<Bill> => {
    const response = await api.patch<Bill>(`/homes/${homeId}/bills/${billId}`);
    return response.data;
  },
};

// ============ Shopping API ============
export const shoppingApi = {
  // Categories
  createCategory: async (homeId: number, data: CreateCategoryForm): Promise<ShoppingCategory> => {
    const response = await api.post<ShoppingCategory>(`/homes/${homeId}/shopping/categories`, data);
    return response.data;
  },

  getCategories: async (homeId: number): Promise<ShoppingCategory[]> => {
    const response = await api.get<ShoppingCategory[]>(`/homes/${homeId}/shopping/categories/all`);
    return response.data;
  },

  getCategoryById: async (homeId: number, categoryId: number): Promise<ShoppingCategory> => {
    const response = await api.get<ShoppingCategory>(`/homes/${homeId}/shopping/categories/${categoryId}`);
    return response.data;
  },

  getCategoryItems: async (homeId: number, categoryId: number): Promise<ShoppingItem[]> => {
    const response = await api.get<ShoppingItem[]>(`/homes/${homeId}/shopping/categories/${categoryId}/items`);
    return response.data;
  },

  deleteCategory: async (homeId: number, categoryId: number): Promise<{ message: string }> => {
    const response = await api.delete<{ message: string }>(`/homes/${homeId}/shopping/categories/${categoryId}`);
    return response.data;
  },

  editCategory: async (
    homeId: number,
    categoryId: number,
    data: { name?: string; icon?: string }
  ): Promise<ShoppingCategory> => {
    const response = await api.put<ShoppingCategory>(`/homes/${homeId}/shopping/categories/${categoryId}`, data);
    return response.data;
  },

  // Items
  createItem: async (homeId: number, data: CreateItemForm): Promise<ShoppingItem> => {
    const response = await api.post<ShoppingItem>(`/homes/${homeId}/shopping/items`, data);
    return response.data;
  },

  getItemById: async (homeId: number, itemId: number): Promise<ShoppingItem> => {
    const response = await api.get<ShoppingItem>(`/homes/${homeId}/shopping/items/${itemId}`);
    return response.data;
  },

  deleteItem: async (homeId: number, itemId: number): Promise<{ message: string }> => {
    const response = await api.delete<{ message: string }>(`/homes/${homeId}/shopping/items/${itemId}`);
    return response.data;
  },

  editItem: async (
    homeId: number,
    itemId: number,
    data: { name?: string; image?: string; link?: string; is_bought?: boolean; bought_date?: string }
  ): Promise<ShoppingItem> => {
    const response = await api.put<ShoppingItem>(`/homes/${homeId}/shopping/items/${itemId}`, data);
    return response.data;
  },

  markBought: async (homeId: number, itemId: number): Promise<ShoppingItem> => {
    const response = await api.patch<ShoppingItem>(`/homes/${homeId}/shopping/items/${itemId}`);
    return response.data;
  },
};

// ============ Poll API ============
export const pollApi = {
  create: async (homeId: number, data: CreatePollForm): Promise<Poll> => {
    const response = await api.post<Poll>(`/homes/${homeId}/polls`, data);
    return response.data;
  },

  getByHomeId: async (homeId: number): Promise<Poll[]> => {
    const response = await api.get<Poll[]>(`/homes/${homeId}/polls`);
    return response.data;
  },

  getById: async (homeId: number, pollId: number): Promise<Poll> => {
    const response = await api.get<Poll>(`/homes/${homeId}/polls/${pollId}`);
    return response.data;
  },

  close: async (homeId: number, pollId: number): Promise<Poll> => {
    const response = await api.patch<Poll>(`/homes/${homeId}/polls/${pollId}/close`);
    return response.data;
  },

  delete: async (homeId: number, pollId: number): Promise<{ message: string }> => {
    const response = await api.delete<{ message: string }>(`/homes/${homeId}/polls/${pollId}`);
    return response.data;
  },

  vote: async (homeId: number, pollId: number, optionId: number): Promise<{ message: string }> => {
    const response = await api.post<{ message: string }>(`/homes/${homeId}/polls/${pollId}/vote`, {
      option_id: optionId,
    });
    return response.data;
  },
};

// ============ Notification API ============
export const notificationApi = {
  getUserNotifications: async (): Promise<Notification[]> => {
    const response = await api.get<Notification[]>("/homes/notifications");
    return response.data;
  },

  markAsRead: async (notificationId: number): Promise<{ message: string }> => {
    const response = await api.delete<{ message: string }>(`/homes/notifications/${notificationId}`);
    return response.data;
  },

  getHomeNotifications: async (homeId: number): Promise<HomeNotification[]> => {
    const response = await api.get<HomeNotification[]>(`/homes/${homeId}/notifications`);
    return response.data;
  },

  markHomeNotificationAsRead: async (homeId: number, notificationId: number): Promise<{ message: string }> => {
    const response = await api.delete<{ message: string }>(`/homes/${homeId}/notifications/${notificationId}`);
    return response.data;
  },
};

// ============ Image Upload API ============
export const imageApi = {
  upload: async (formData: FormData): Promise<{ url: string }> => {
    const response = await api.post<{ url: string }>("/upload", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  },
};

// Re-export types for convenience
export type {
  User,
  Home,
  Room,
  Task,
  TaskAssignment,
  Bill,
  ShoppingCategory,
  ShoppingItem,
  Poll,
  PollOption,
  Vote,
  Notification,
  HomeNotification,
} from "./types";
