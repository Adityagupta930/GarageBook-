export interface InventoryItem {
  id: number;
  name: string;
  stock: number;
  price: number;
  buy_price: number;
  created_at: string;
}

export interface Customer {
  id: number;
  name: string;
  phone: string;
  address: string;
  created_at: string;
}

export interface Sale {
  id: number;
  item_id: number | null;
  item_name: string;
  qty: number;
  amount: number;
  buy_price: number;
  payment: 'cash' | 'online' | 'udhaar';
  customer: string;
  phone: string;
  date: string;
  udhaar_paid: 0 | 1;
}

export interface Return {
  id: number;
  sale_id: number | null;
  item_id: number | null;
  item_name: string;
  qty: number;
  amount: number;
  reason: string;
  date: string;
}

export interface ReportSummary {
  totalSales: number;
  cashSales: number;
  onlineSales: number;
  creditSales: number;
  profit: number;
  totalItems: number;
  pendingCredit: number;
}
