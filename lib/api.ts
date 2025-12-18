import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  User,
  Home,
  Room,
  Task,
  TaskAssignment,
  Bill,
  BillCategory,
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

  googleSignIn: async (email: string, name: string, avatar: string): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>("/auth/google/mobile", { email, name, avatar });
    if (response.data.token) {
      await AsyncStorage.setItem("auth_token", response.data.token);
      await AsyncStorage.setItem("user", JSON.stringify(response.data.user));
    }
    return response.data;
  },
};

// ============ User API ============
export const userApi = {
  getMe: async (): Promise<User> => {
    const response = await api.post<{ status: boolean; user: User }>("/user");
    return response.data.user;
  },

  update: async (data: { name?: string; avatar?: string }): Promise<{ message: string }> => {
    const formData = new FormData();
    if (data.name) formData.append("name", data.name);
    if (data.avatar) formData.append("avatar", data.avatar);

    const response = await api.patch<{ status: boolean; message: string }>("/user", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return { message: response.data.message };
  },
};

// ============ Home API ============
export const homeApi = {
  create: async (name: string): Promise<{ message: string }> => {
    const response = await api.post<{ status: boolean; message: string }>("/homes/create", { name });
    return { message: response.data.message };
  },

  getUserHome: async (): Promise<Home> => {
    const response = await api.get<{ home: Home }>("/homes/my");
    return response.data.home;
  },

  getById: async (homeId: number): Promise<Home> => {
    const response = await api.get<{ home: Home }>(`/homes/${homeId}`);
    return response.data.home;
  },

  join: async (code: string): Promise<{ message: string }> => {
    const response = await api.post<{ status: boolean; message: string }>("/homes/join", { code });
    return { message: response.data.message };
  },

  leave: async (homeId: number): Promise<{ message: string }> => {
    const response = await api.post<{ status: boolean; message: string }>(`/homes/${homeId}/leave`);
    return { message: response.data.message };
  },

  delete: async (homeId: number): Promise<{ message: string }> => {
    const response = await api.delete<{ status: boolean; message: string }>(`/homes/${homeId}`);
    return { message: response.data.message };
  },

  removeMember: async (homeId: number, userId: number): Promise<{ message: string }> => {
    const response = await api.delete<{ status: boolean; message: string }>(`/homes/${homeId}/members/${userId}`);
    return { message: response.data.message };
  },

  regenerateInviteCode: async (homeId: number): Promise<{ message: string }> => {
    const response = await api.post<{ status: boolean; message: string }>(`/homes/${homeId}/regenerate_code`);
    return { message: response.data.message };
  },
};

// ============ Room API ============
export const roomApi = {
  create: async (homeId: number, name: string): Promise<{ message: string }> => {
    const response = await api.post<{ status: boolean; message: string }>(`/homes/${homeId}/rooms`, { name, home_id: homeId });
    return { message: response.data.message };
  },

  getByHomeId: async (homeId: number): Promise<Room[]> => {
    const response = await api.get<{ status: boolean; rooms: Room[] }>(`/homes/${homeId}/rooms`);
    return response.data.rooms || [];
  },

  getById: async (homeId: number, roomId: number): Promise<Room> => {
    const response = await api.get<{ status: boolean; room: Room }>(`/homes/${homeId}/rooms/${roomId}`);
    return response.data.room;
  },

  delete: async (homeId: number, roomId: number): Promise<{ message: string }> => {
    const response = await api.delete<{ status: boolean; message: string }>(`/homes/${homeId}/rooms/${roomId}`);
    return { message: response.data.message };
  },
};

// ============ Task API ============
export const taskApi = {
  create: async (homeId: number, data: CreateTaskForm): Promise<{ message: string }> => {
    const response = await api.post<{ status: boolean; message: string }>(`/homes/${homeId}/tasks`, data);
    return { message: response.data.message };
  },

  getByHomeId: async (homeId: number): Promise<Task[]> => {
    const response = await api.get<{ status: boolean; tasks: Task[] }>(`/homes/${homeId}/tasks`);
    return response.data.tasks || [];
  },

  getById: async (homeId: number, taskId: number): Promise<Task> => {
    const response = await api.get<{ status: boolean; task: Task }>(`/homes/${homeId}/tasks/${taskId}`);
    return response.data.task;
  },

  delete: async (homeId: number, taskId: number): Promise<{ message: string }> => {
    const response = await api.delete<{ status: boolean; message: string }>(`/homes/${homeId}/tasks/${taskId}`);
    return { message: response.data.message };
  },

  assignUser: async (homeId: number, taskId: number, userId: number, date: string): Promise<{ message: string }> => {
    const response = await api.post<{ status: boolean; message: string }>(`/homes/${homeId}/tasks/${taskId}/assign`, {
      task_id: taskId,
      home_id: homeId,
      user_id: userId,
      date,
    });
    return { message: response.data.message };
  },

  reassignRoom: async (homeId: number, taskId: number, roomId: number): Promise<{ message: string }> => {
    const response = await api.patch<{ status: boolean; message: string }>(`/homes/${homeId}/tasks/${taskId}/reassign-room`, {
      task_id: taskId,
      room_id: roomId,
    });
    return { message: response.data.message };
  },

  markCompleted: async (homeId: number, taskId: number, assignmentId: number): Promise<{ message: string }> => {
    const response = await api.patch<{ status: boolean; message: string }>(`/homes/${homeId}/tasks/${taskId}/mark-completed`, {
      assignment_id: assignmentId,
    });
    return { message: response.data.message };
  },

  markUncompleted: async (homeId: number, taskId: number, assignmentId: number): Promise<{ message: string }> => {
    const response = await api.patch<{ status: boolean; message: string }>(`/homes/${homeId}/tasks/${taskId}/mark-uncompleted`, {
      assignment_id: assignmentId,
    });
    return { message: response.data.message };
  },

  // Mark task as completed for current user (auto-assigns if not assigned)
  completeTask: async (homeId: number, taskId: number): Promise<{ message: string }> => {
    const response = await api.patch<{ status: boolean; message: string }>(`/homes/${homeId}/tasks/${taskId}/complete`);
    return { message: response.data.message };
  },

  deleteAssignment: async (homeId: number, taskId: number, assignmentId: number): Promise<{ message: string }> => {
    const response = await api.delete<{ status: boolean; message: string }>(
      `/homes/${homeId}/tasks/${taskId}/assignments/${assignmentId}`
    );
    return { message: response.data.message };
  },

  getUserAssignments: async (homeId: number, userId: number): Promise<TaskAssignment[]> => {
    const response = await api.get<{ status: boolean; assignments: TaskAssignment[] }>(`/homes/${homeId}/users/${userId}/assignments`);
    return response.data.assignments || [];
  },

  getClosestAssignment: async (homeId: number, userId: number): Promise<TaskAssignment | null> => {
    const response = await api.get<{ status: boolean; assignment: TaskAssignment | null }>(`/homes/${homeId}/users/${userId}/assignments/closest`);
    return response.data.assignment;
  },
};

// ============ Bill API ============
export const billApi = {
  create: async (homeId: number, data: CreateBillForm & { bill_category_id?: number }): Promise<{ message: string }> => {
    const response = await api.post<{ status: boolean; message: string }>(`/homes/${homeId}/bills`, data);
    return { message: response.data.message };
  },

  getByHomeId: async (homeId: number): Promise<Bill[]> => {
    const response = await api.get<{ status: boolean; bills: Bill[] }>(`/homes/${homeId}/bills`);
    return response.data.bills || [];
  },

  getById: async (homeId: number, billId: number): Promise<Bill> => {
    const response = await api.get<{ status: boolean; bill: Bill }>(`/homes/${homeId}/bills/${billId}`);
    return response.data.bill;
  },

  delete: async (homeId: number, billId: number): Promise<{ message: string }> => {
    const response = await api.delete<{ status: boolean; message: string }>(`/homes/${homeId}/bills/${billId}`);
    return { message: response.data.message };
  },

  markPayed: async (homeId: number, billId: number): Promise<{ message: string }> => {
    const response = await api.patch<{ status: boolean; message: string }>(`/homes/${homeId}/bills/${billId}`);
    return { message: response.data.message };
  },
};

export const billCategoryApi = {
  create: async (homeId: number, data: { name: string; color?: string }): Promise<{ message: string }> => {
    const response = await api.post<{ status: boolean; message: string }>(`/homes/${homeId}/bill-categories`, data);
    return { message: response.data.message };
  },

  getAll: async (homeId: number): Promise<BillCategory[]> => {
    const response = await api.get<{ status: boolean; categories: BillCategory[] }>(`/homes/${homeId}/bill-categories`);
    return response.data.categories || [];
  },

  delete: async (homeId: number, categoryId: number): Promise<{ message: string }> => {
    const response = await api.delete<{ status: boolean; message: string }>(`/homes/${homeId}/bill-categories/${categoryId}`);
    return { message: response.data.message };
  },
};

// ============ Shopping API ============
export const shoppingApi = {
  // Categories
  createCategory: async (homeId: number, data: CreateCategoryForm): Promise<{ message: string }> => {
    const response = await api.post<{ status: boolean; message: string }>(`/homes/${homeId}/shopping/categories`, data);
    return { message: response.data.message };
  },

  getCategories: async (homeId: number): Promise<ShoppingCategory[]> => {
    const response = await api.get<{ status: boolean; categories: ShoppingCategory[] }>(`/homes/${homeId}/shopping/categories/all`);
    return response.data.categories || [];
  },

  getCategoryById: async (homeId: number, categoryId: number): Promise<ShoppingCategory> => {
    const response = await api.get<{ status: boolean; category: ShoppingCategory }>(`/homes/${homeId}/shopping/categories/${categoryId}`);
    return response.data.category;
  },

  getCategoryItems: async (homeId: number, categoryId: number): Promise<ShoppingItem[]> => {
    const response = await api.get<{ status: boolean; items: ShoppingItem[] }>(`/homes/${homeId}/shopping/categories/${categoryId}/items`);
    return response.data.items || [];
  },
  deleteCategory: async (homeId: number, categoryId: number): Promise<{ message: string }> => {
    const response = await api.delete<{ status: boolean; message: string }>(`/homes/${homeId}/shopping/categories/${categoryId}`);
    return { message: response.data.message };
  },

  editCategory: async (
    homeId: number,
    categoryId: number,
    data: { name?: string; icon?: string }
  ): Promise<{ message: string }> => {
    const response = await api.put<{ status: boolean; message: string }>(`/homes/${homeId}/shopping/categories/${categoryId}`, data);
    return { message: response.data.message };
  },

  // Items
  createItem: async (homeId: number, data: CreateItemForm): Promise<{ message: string }> => {
    const response = await api.post<{ status: boolean; message: string }>(`/homes/${homeId}/shopping/items`, data);
    return { message: response.data.message };
  },

  getItemById: async (homeId: number, itemId: number): Promise<ShoppingItem> => {
    const response = await api.get<{ status: boolean; item: ShoppingItem }>(`/homes/${homeId}/shopping/items/${itemId}`);
    return response.data.item;
  },

  deleteItem: async (homeId: number, itemId: number): Promise<{ message: string }> => {
    const response = await api.delete<{ status: boolean; message: string }>(`/homes/${homeId}/shopping/items/${itemId}`);
    return { message: response.data.message };
  },

  editItem: async (
    homeId: number,
    itemId: number,
    data: { name?: string; image?: string; link?: string; is_bought?: boolean; bought_date?: string }
  ): Promise<{ message: string }> => {
    const response = await api.put<{ status: boolean; message: string }>(`/homes/${homeId}/shopping/items/${itemId}`, data);
    return { message: response.data.message };
  },

  markBought: async (homeId: number, itemId: number): Promise<{ message: string }> => {
    const response = await api.patch<{ status: boolean; message: string }>(`/homes/${homeId}/shopping/items/${itemId}`);
    return { message: response.data.message };
  },
};

// ============ Poll API ============
export const pollApi = {
  create: async (homeId: number, data: CreatePollForm): Promise<{ message: string }> => {
    const response = await api.post<{ status: boolean; message: string }>(`/homes/${homeId}/polls`, data);
    return { message: response.data.message };
  },

  getByHomeId: async (homeId: number): Promise<Poll[]> => {
    const response = await api.get<{ status: boolean; polls: Poll[] }>(`/homes/${homeId}/polls`);
    return response.data.polls || [];
  },

  getById: async (homeId: number, pollId: number): Promise<Poll> => {
    const response = await api.get<{ status: boolean; poll: Poll }>(`/homes/${homeId}/polls/${pollId}`);
    return response.data.poll;
  },

  close: async (homeId: number, pollId: number): Promise<{ message: string }> => {
    const response = await api.patch<{ status: boolean; message: string }>(`/homes/${homeId}/polls/${pollId}/close`);
    return { message: response.data.message };
  },

  delete: async (homeId: number, pollId: number): Promise<{ message: string }> => {
    const response = await api.delete<{ status: boolean; message: string }>(`/homes/${homeId}/polls/${pollId}`);
    return { message: response.data.message };
  },

  vote: async (homeId: number, pollId: number, optionId: number): Promise<{ message: string }> => {
    const response = await api.post<{ status: boolean; message: string }>(`/homes/${homeId}/polls/${pollId}/vote`, {
      option_id: optionId,
    });
    return { message: response.data.message };
  },
};

// ============ Notification API ============
export const notificationApi = {
  getUserNotifications: async (): Promise<Notification[]> => {
    const response = await api.get<{ status: boolean; notifications: Notification[] }>("/homes/notifications");
    return response.data.notifications || [];
  },

  markAsRead: async (notificationId: number): Promise<{ message: string }> => {
    const response = await api.delete<{ status: boolean; message: string }>(`/homes/notifications/${notificationId}`);
    return { message: response.data.message };
  },

  getHomeNotifications: async (homeId: number): Promise<HomeNotification[]> => {
    const response = await api.get<{ status: boolean; notifications: HomeNotification[] }>(`/homes/${homeId}/notifications`);
    return response.data.notifications || [];
  },

  markHomeNotificationAsRead: async (homeId: number, notificationId: number): Promise<{ message: string }> => {
    const response = await api.delete<{ status: boolean; message: string }>(`/homes/${homeId}/notifications/${notificationId}`);
    return { message: response.data.message };
  },
};

// ============ Image Upload API ============
export const imageApi = {
  upload: async (formData: FormData): Promise<{ url: string }> => {
    const response = await api.post<{ status: boolean; message: string; url: string }>("/upload", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return { url: response.data.url };
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
