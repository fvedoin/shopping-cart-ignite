import { createContext, ReactNode, useContext, useState } from "react";
import { toast } from "react-toastify";
import { api } from "../services/api";
import { Product, Stock } from "../types";

interface CartProviderProps {
  children: ReactNode;
}

interface UpdateProductAmount {
  productId: number;
  amount: number;
}

interface CartContextData {
  cart: Product[];
  addProduct: (productId: number) => Promise<void>;
  removeProduct: (productId: number) => void;
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: CartProviderProps): JSX.Element {
  const [cart, setCart] = useState<Product[]>(() => {
    const storagedCart = localStorage.getItem("@RocketShoes:cart");

    if (storagedCart) {
      return JSON.parse(storagedCart);
    }

    return [];
  });

  const addProduct = async (productId: number) => {
    try {
      const response = await api.get(`stock/${productId}`);
      const stock: Stock = response.data;
      const index = cart.findIndex((item) => item.id === productId);
      if (index < 0) {
        if (stock.amount < 1) {
          toast.error("Quantidade solicitada fora de estoque");
        } else {
          const { data } = await api.get(`products/${productId}`);
          setCart([...cart, { ...data, amount: 1 }]);
        }
      } else {
        if (stock.amount <= cart[index].amount) {
          toast.error("Quantidade solicitada fora de estoque");
        } else {
          setCart([
            ...cart.filter((item) => {
              return item.id !== productId;
            }),
            { ...cart[index], amount: cart[index].amount + 1 },
          ]);
        }
      }
    } catch {
      toast.error("Erro na adição do produto");
    }
  };

  const removeProduct = (productId: number) => {
    try {
      setCart(
        cart.filter((item) => {
          return item.id !== productId;
        })
      );
    } catch {
      toast.error("Erro na remoção do produto");
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
      const response = await api.get(`stock/${productId}`);
      const stock: Stock = response.data;
      if (amount > stock.amount) {
        toast.error("Quantidade solicitada fora de estoque");
        return;
      }
      setCart(
        cart.map((item) => {
          if (item.id === productId) {
            item.amount = amount;
          }
          return item;
        })
      );
    } catch {
      toast.error("Erro na alteração de quantidade do produto");
    }
  };

  return (
    <CartContext.Provider
      value={{
        cart,
        addProduct,
        removeProduct,
        updateProductAmount,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextData {
  const context = useContext(CartContext);

  return context;
}
