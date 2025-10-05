import { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { CheckCircle2, Circle } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHome } from "@/contexts/HomeContext";
import { shoppingApi, ShoppingCategory, ShoppingItem } from "@/lib/api";
import Colors from "@/constants/colors";

export default function ShoppingScreen() {
  const insets = useSafeAreaInsets();
  const { home } = useHome();
  const [categories, setCategories] = useState<ShoppingCategory[]>([]);
  const [items, setItems] = useState<Record<string, ShoppingItem[]>>({});
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  const loadShoppingData = useCallback(async () => {
    if (!home) return;

    try {
      setIsLoading(true);
      const categoriesRes = await shoppingApi.getCategories(home.id);
      setCategories(categoriesRes.data);

      const itemsData: Record<string, ShoppingItem[]> = {};
      for (const category of categoriesRes.data) {
        const itemsRes = await shoppingApi.getCategoryItems(home.id, category.id);
        itemsData[category.id] = itemsRes.data;
      }
      setItems(itemsData);
    } catch (error) {
      console.error("Error loading shopping data:", error);
    } finally {
      setIsLoading(false);
    }
  }, [home]);

  useEffect(() => {
    if (home) {
      loadShoppingData();
    }
  }, [home, loadShoppingData]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadShoppingData();
    setRefreshing(false);
  };

  const toggleItemBought = async (categoryId: string, itemId: string) => {
    if (!home) return;

    try {
      await shoppingApi.markItemBought(home.id, itemId);
      setItems((prev) => ({
        ...prev,
        [categoryId]: prev[categoryId].map((item) =>
          item.id === itemId ? { ...item, bought: !item.bought } : item
        ),
      }));
    } catch (error) {
      console.error("Error toggling item:", error);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.black} />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + 20 }]}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <Text style={styles.title}>Shopping List</Text>

      {categories.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No shopping categories yet</Text>
        </View>
      ) : (
        categories.map((category) => (
          <View key={category.id} style={styles.categorySection}>
            <Text style={styles.categoryTitle}>{category.name}</Text>

            {items[category.id]?.length === 0 ? (
              <View style={styles.emptyCard}>
                <Text style={styles.emptyCardText}>No items in this category</Text>
              </View>
            ) : (
              items[category.id]?.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  style={[
                    styles.itemCard,
                    item.bought && styles.itemCardBought,
                  ]}
                  onPress={() => toggleItemBought(category.id, item.id)}
                >
                  <View style={styles.itemContent}>
                    {item.bought ? (
                      <CheckCircle2 size={24} color={Colors.black} />
                    ) : (
                      <Circle size={24} color={Colors.gray400} />
                    )}
                    <View style={styles.itemText}>
                      <Text
                        style={[
                          styles.itemName,
                          item.bought && styles.itemNameBought,
                        ]}
                      >
                        {item.name}
                      </Text>
                      {item.quantity ? (
                        <Text style={styles.itemQuantity}>Qty: {item.quantity}</Text>
                      ) : null}
                    </View>
                  </View>
                </TouchableOpacity>
              ))
            )}
          </View>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: Colors.white,
  },
  title: {
    fontSize: 32,
    fontWeight: "700" as const,
    color: Colors.black,
    marginBottom: 24,
  },
  emptyContainer: {
    padding: 40,
    alignItems: "center",
  },
  emptyText: {
    fontSize: 16,
    color: Colors.gray600,
  },
  categorySection: {
    marginBottom: 32,
  },
  categoryTitle: {
    fontSize: 20,
    fontWeight: "700" as const,
    color: Colors.black,
    marginBottom: 16,
  },
  itemCard: {
    backgroundColor: Colors.gray50,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  itemCardBought: {
    opacity: 0.6,
  },
  itemContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  itemText: {
    flex: 1,
  },
  itemName: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: Colors.black,
    marginBottom: 4,
  },
  itemNameBought: {
    textDecorationLine: "line-through",
    color: Colors.gray600,
  },
  itemQuantity: {
    fontSize: 14,
    color: Colors.gray600,
  },
  emptyCard: {
    backgroundColor: Colors.gray50,
    borderRadius: 16,
    padding: 24,
    alignItems: "center",
  },
  emptyCardText: {
    fontSize: 14,
    color: Colors.gray600,
  },
});
