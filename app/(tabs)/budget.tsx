import { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { DollarSign, Plus, Trash, ScanLine } from "lucide-react-native";
import Svg, { Circle } from "react-native-svg";
import * as ImagePicker from "expo-image-picker";
import { useHome } from "@/contexts/HomeContext";
import { useTheme } from "@/contexts/ThemeContext";
import { useAuth } from "@/contexts/AuthContext";
import { useI18n } from "@/contexts/I18nContext";
import { billApi, billCategoryApi, imageApi, ocrApi } from "@/lib/api";
import { Bill, BillCategory } from "@/lib/types";
import fonts from "@/constants/fonts";
import Modal from "@/components/ui/modal";
import Input from "@/components/ui/input";
import Button from "@/components/ui/button";


const DonutChart = ({ data, size = 180, strokeWidth = 20, total, theme }: { data: { value: number; color: string }[]; size?: number; strokeWidth?: number; total: number; theme: any }) => {
  const center = size / 2;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  let currentAngle = -90;

  return (
    <View className="justify-center items-center" style={{ width: size, height: size }}>
      <Svg width={size} height={size}>
        {data.map((item, index) => {
          const percentage = item.value / total;
          const strokeLength = circumference * percentage;
          const angle = percentage * 360;

          const circle = (
            <Circle
              key={index}
              cx={center}
              cy={center}
              r={radius}
              stroke={item.color}
              strokeWidth={strokeWidth}
              fill="transparent"
              strokeDasharray={[strokeLength, circumference]}
              strokeDashoffset={0}
              rotation={currentAngle}
              origin={`${center}, ${center}`}
              strokeLinecap="round"
            />
          );

          currentAngle += angle;
          return circle;
        })}
      </Svg>
      <View className="absolute justify-center items-center">
        <Text className="text-2xl font-manrope-bold" style={{ color: theme.text }}>${total.toFixed(0)}</Text>
        <Text className="text-xs font-manrope" style={{ color: theme.textSecondary }}>Total</Text>
      </View>
    </View>
  );
};

export default function BudgetScreen() {
  const insets = useSafeAreaInsets();
  const { home } = useHome();
  const { theme } = useTheme();
  const { user } = useAuth();
  const { t } = useI18n();

  const [bills, setBills] = useState<Bill[]>([]);
  const [categories, setCategories] = useState<BillCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Create bill modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
  const [newBillAmount, setNewBillAmount] = useState("");
  const [creating, setCreating] = useState(false);

  // Create category modal
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [selectedColor, setSelectedColor] = useState(theme.accent.yellow);
  const [creatingCategory, setCreatingCategory] = useState(false);
  
  // OCR
  const [scanning, setScanning] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState("eng");

  // Color options for categories
  const COLOR_OPTIONS = [
    "#FF7476", "#FF9F7A", "#FBEB9E", "#A8E6CF", "#7DD3E8", "#D8D4FC", "#F5A3D3",
    "#22C55E", "#F472B6", "#C4B5FD", "#94A3B8", "#FDE68A", "#6EE7B7",
  ];

  const LANGUAGES = [
    { code: "eng", label: "English" },
    { code: "pol", label: "Polski" },
    { code: "ukr", label: "Українська" },
    { code: "bel", label: "Беларуская" },
  ];

  const loadData = useCallback(async () => {
    if (!home) {
      setIsLoading(false);
      return;
    }

    try {
      const [billsData, categoriesData] = await Promise.all([
        billApi.getByHomeId(home.id).catch(() => []),
        billCategoryApi.getAll(home.id).catch(() => []),
      ]);
      setBills(billsData || []);
      setCategories(categoriesData || []);
    } catch (error) {
      console.error("Error loading budget data:", error);
    } finally {
      setIsLoading(false);
    }
  }, [home]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleCreateCategory = async () => {
    if (!home || !newCategoryName.trim()) return;

    setCreatingCategory(true);
    try {
      await billCategoryApi.create(home.id, {
        name: newCategoryName.trim(),
        color: selectedColor,
      });
      setNewCategoryName("");
      setShowCategoryModal(false);
      await loadData();
    } catch (error) {
      console.error("Error creating category:", error);
      Alert.alert(t.common.error, t.budget.failedToCreate);
    } finally {
      setCreatingCategory(false);
    }
  };

  const handleDeleteCategory = async (categoryId: number) => {
    if (!home) return;
    Alert.alert(
      t.budget.deleteCategory,
      t.budget.deleteCategoryConfirm,
      [
        { text: t.common.cancel, style: "cancel" },
        {
          text: t.common.delete,
          style: "destructive",
          onPress: async () => {
            try {
              await billCategoryApi.delete(home.id, categoryId);
              await loadData();
            } catch (error) {
              console.error(error);
              Alert.alert(t.common.error, t.budget.failedToDelete);
            }
          },
        },
      ]
    );
  };

  const handleCreateBill = async () => {
    if (!home || !newBillAmount || !selectedCategoryId) return;

    setCreating(true);
    try {
      const now = new Date();
      const endDate = new Date(now);
      endDate.setMonth(endDate.getMonth() + 1);

      const category = categories.find(c => c.id === selectedCategoryId);

      await billApi.create(home.id, {
        type: category?.name || "Expense", // Fallback type
        bill_category_id: selectedCategoryId,
        total_amount: parseFloat(newBillAmount),
        period_start: now.toISOString(),
        period_end: endDate.toISOString(),
        ocr_data: {},
      });

      setNewBillAmount("");
      setSelectedCategoryId(null);
      setShowCreateModal(false);
      await loadData();
    } catch (error) {
      console.error("Error creating bill:", error);
      Alert.alert(t.common.error, t.budget.failedToCreate);
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteBill = async (billId: number) => {
    if (!home) return;
    Alert.alert(t.budget.deleteBill, t.budget.deleteBillConfirm, [
      { text: t.common.cancel, style: "cancel" },
      {
        text: t.common.delete,
        style: "destructive",
        onPress: async () => {
          try {
            await billApi.delete(home.id, billId);
            await loadData();
          } catch (error) {
            console.error(error);
            Alert.alert(t.common.error, t.budget.failedToDelete);
          }
        },
      },
    ]);
  };

  const handleScan = async () => {
    try {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            quality: 0.8,
        });

        if (!result.canceled && result.assets[0].uri) {
            setScanning(true);
            
            // Upload
            const formData = new FormData();
            // @ts-ignore
            formData.append("image", {
                uri: result.assets[0].uri,
                name: "receipt.jpg",
                type: "image/jpeg",
            });

            const uploadRes = await imageApi.upload(formData);
            
            // OCR with selected language
            const ocrRes = await ocrApi.process(uploadRes.url, selectedLanguage);
            
            if (ocrRes.total_amount) {
                setNewBillAmount(ocrRes.total_amount.toString());
                Alert.alert(t.common.success || "Success", `Scanned amount: ${ocrRes.total_amount}`);
            } else {
                Alert.alert("OCR", "Could not detect total amount");
            }
        }
    } catch (error) {
        console.error("Scan error:", error);
        Alert.alert(t.common.error, "Failed to scan receipt");
    } finally {
        setScanning(false);
    }
  };

  const getCategoryColor = (categoryId?: number) => {
    const category = categories.find(c => c.id === categoryId);
    return category?.color || theme.accent.yellow;
  };

  const getCategoryName = (bill: Bill) => {
    if (bill.bill_category) return bill.bill_category.name;
    const category = categories.find(c => c.id === bill.bill_category_id);
    return category?.name || bill.type;
  };

  const chartData = categories.map(cat => {
    const catBills = bills.filter(b => b.bill_category_id === cat.id);
    const total = catBills.reduce((sum, b) => sum + b.total_amount, 0);
    return {
      value: total,
      color: cat.color || theme.accent.yellow,
      name: cat.name
    };
  }).filter(d => d.value > 0);

  const uncategorizedBills = bills.filter(b => !b.bill_category_id);
  if (uncategorizedBills.length > 0) {
    const total = uncategorizedBills.reduce((sum, b) => sum + b.total_amount, 0);
    chartData.push({
      value: total,
      color: theme.textSecondary,
      name: t.budget.uncategorized
    });
  }

  const totalSpend = bills.reduce((sum, b) => sum + b.total_amount, 0);

  if (isLoading) {
    return (
      <View className="flex-1 justify-center items-center" style={{ backgroundColor: theme.background }}>
        <ActivityIndicator size="large" color={theme.text} />
      </View>
    );
  }

  return (
    <View className="flex-1" style={{ backgroundColor: theme.background }}>
      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 100, paddingTop: insets.top + 24 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.text} />}
      >
        <View className="flex-row justify-between items-center mb-6">
          <Text className="text-3xl font-manrope-bold" style={{ color: theme.text }}>{t.budget.title}</Text>
          <View className="flex-row gap-2.5">
            <TouchableOpacity
              className="px-4 py-2 rounded-xl justify-center items-center"
              style={{ backgroundColor: theme.surface }}
              onPress={() => setShowCategoryModal(true)}
            >
              <Text className="text-xs font-manrope-semibold" style={{ color: theme.text }}>+ {t.budget.category}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              className="px-4 py-2 rounded-xl justify-center items-center"
              style={{ backgroundColor: theme.accent.pink }}
              onPress={() => setShowCreateModal(true)}
            >
              <Plus size={24} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Chart */}
        {totalSpend > 0 && (
          <View className="items-center mb-8">
            <DonutChart data={chartData} total={totalSpend} theme={theme} />
          </View>
        )}

        {/* Categories List (Horizontal) */}
        <View className="mb-6">
          <Text className="text-sm font-manrope-bold uppercase mb-3" style={{ color: theme.textSecondary }}>{t.budget.categories}</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12 }}>
            {categories.map(cat => (
              <TouchableOpacity
                key={cat.id}
                className="flex-row items-center px-3 py-2 rounded-2xl border gap-2"
                style={{ backgroundColor: theme.surface, borderColor: theme.border }}
                onLongPress={() => handleDeleteCategory(cat.id)}
              >
                <View className="w-2 h-2 rounded-full" style={{ backgroundColor: cat.color || theme.accent.yellow }} />
                <Text className="font-manrope-semibold text-sm" style={{ color: theme.text }}>{cat.name}</Text>
              </TouchableOpacity>
            ))}
            {categories.length === 0 && (
              <Text className="italic" style={{ color: theme.textSecondary }}>{t.budget.noCategories}</Text>
            )}
          </ScrollView>
        </View>

        {/* Bills List */}
        <View className="gap-3">
          {bills.map((bill) => (
            <View key={bill.id} className="p-4 rounded-2xl" style={{ backgroundColor: theme.surface }}>

              <View className="flex-row items-center gap-3">

                <View className="w-10 h-10 rounded-full justify-center items-center" style={{ backgroundColor: getCategoryColor(bill.bill_category_id) }}>
                  <DollarSign size={20} color="#1C1C1E" />
                </View>

                <View className="flex-1">
                  <Text className="text-base font-manrope-semibold mb-0.5" style={{ color: theme.text }}>{getCategoryName(bill)}</Text>
                  <Text className="text-xs" style={{ color: theme.textSecondary }}>
                    {new Date(bill.created_at).toLocaleDateString("pl-PL")} {new Date(bill.created_at).toLocaleTimeString("pl-PL", { hour: '2-digit', minute: '2-digit' })}
                  </Text>
                </View>

                <Text className="text-lg font-manrope-bold" style={{ color: theme.text }}>
                  ${bill.total_amount.toFixed(2)}
                </Text>

                <TouchableOpacity
                  onPress={() => handleDeleteBill(bill.id)}
                  className="p-0.5"
                >
                  <Trash size={18} color={theme.accent.pink || "#FF3B30"} />
                </TouchableOpacity>

              </View>
            </View>
          ))}

          {bills.length === 0 && (
            <Text className="text-center mt-10" style={{ color: theme.textSecondary }}>
              {t.budget.noExpenses}
            </Text>
          )}
        </View>
      </ScrollView>

      {/* Create Bill Modal */}
      <Modal
        visible={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title={t.budget.addExpense}
        height="full"
      >
        <View className="pt-2.5">
          {/* Scan Section */}
          <View className="mb-6">
            <Text className="text-xs font-manrope-bold uppercase mb-2" style={{ color: theme.textSecondary }}>Scan Receipt</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-3" contentContainerStyle={{ gap: 8 }}>
                {LANGUAGES.map((lang) => (
                    <TouchableOpacity
                        key={lang.code}
                        onPress={() => setSelectedLanguage(lang.code)}
                        className={`px-3 py-1.5 rounded-full border ${selectedLanguage === lang.code ? 'bg-black border-black' : 'bg-transparent border-gray-300'}`}
                        style={{ 
                            backgroundColor: selectedLanguage === lang.code ? theme.text : 'transparent',
                            borderColor: selectedLanguage === lang.code ? theme.text : theme.border 
                        }}
                    >
                        <Text style={{ 
                            color: selectedLanguage === lang.code ? theme.background : theme.textSecondary,
                            fontSize: 12,
                            fontWeight: '600'
                        }}>
                            {lang.label}
                        </Text>
                    </TouchableOpacity>
                ))}
            </ScrollView>
            
            <TouchableOpacity
              className="w-full py-3 rounded-xl flex-row justify-center items-center gap-2 mb-2"
              style={{ backgroundColor: theme.surface, borderStyle: 'dashed', borderWidth: 1, borderColor: theme.border }}
              onPress={handleScan}
              disabled={scanning}
            >
              {scanning ? (
                  <ActivityIndicator size="small" color={theme.text} />
              ) : (
                  <ScanLine size={20} color={theme.text} />
              )}
              <Text className="font-manrope-semibold" style={{ color: theme.text }}>
                  {scanning ? "Scanning..." : "Scan from Gallery"}
              </Text>
            </TouchableOpacity>
          </View>

          <Text className="text-xs font-manrope-bold uppercase mb-2" style={{ color: theme.textSecondary }}>{t.budget.category}</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 20 }}>
            <View className="flex-row gap-2.5">
              {categories.map(cat => (
                <TouchableOpacity
                  key={cat.id}
                  className="px-4 py-2.5 rounded-xl border"
                  style={[
                    { backgroundColor: theme.surface, borderColor: theme.border },
                    selectedCategoryId === cat.id && { borderColor: theme.accent.pink, backgroundColor: theme.accent.pinkLight }
                  ]}
                  onPress={() => setSelectedCategoryId(cat.id)}
                >
                  <Text style={{ color: theme.text }}>{cat.name}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>

          <Input
            label={t.budget.amount}
            placeholder={t.budget.amountPlaceholder}
            value={newBillAmount}
            onChangeText={setNewBillAmount}
            keyboardType="numeric"
          />

          <Button
            title={t.budget.addExpense}
            onPress={handleCreateBill}
            loading={creating}
            disabled={!newBillAmount || !selectedCategoryId}
            variant="pink"
            style={{ marginTop: 20 }}
          />
        </View>
      </Modal>

      {/* Create Category Modal */}
      <Modal
        visible={showCategoryModal}
        onClose={() => setShowCategoryModal(false)}
        title={t.budget.newCategory}
        height="full"
      >
        <View className="pt-2.5">
          <Input
            label={t.budget.categoryName}
            placeholder={t.budget.categoryNamePlaceholder}
            value={newCategoryName}
            onChangeText={setNewCategoryName}
          />

          <Text className="text-xs font-manrope-bold uppercase mb-2 mt-5" style={{ color: theme.textSecondary }}>{t.budget.color}</Text>
          <View className="flex-row flex-wrap gap-3 mb-5">
            {COLOR_OPTIONS.map((color) => (
              <TouchableOpacity
                key={color}
                className="w-8 h-8 rounded-full"
                style={[
                  { backgroundColor: color },
                  selectedColor === color && { borderWidth: 2, borderColor: theme.text }
                ]}
                onPress={() => setSelectedColor(color)}
              />
            ))}
          </View>

          <Button
            title={t.budget.createCategory}
            onPress={handleCreateCategory}
            loading={creatingCategory}
            disabled={!newCategoryName.trim()}
            variant="yellow"
            style={{ marginTop: 20 }}
          />
        </View>
      </Modal>
    </View>
  );
}
