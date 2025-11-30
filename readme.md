

# EC サイト
フロントエンドは **React**、バックエンドは **Firebase Cloud Functions + Express** を使用しています。

実装済みの機能：

- 管理者による商品アップロード（画像 + テキスト情報）
- 商品の公開 / 非公開、削除
- ユーザーの注文作成・注文履歴確認
- 管理者による全注文の確認、発送状態・追跡番号の設定
- **PayPay QR 決済** の統合（QR コード生成 + Webhook による決済完了通知）
- **SSE（Server-Sent Events）** を利用したリアルタイム決済完了通知
- **Firebase Auth ID Token + 管理者メールアドレス** による権限管理

---

## 🔧 技術スタック（Tech Stack）

- **Firebase Cloud Functions（Node.js）**
- **Express**
- **Firebase Admin SDK**
  - Firestore
  - Storage
  - Auth
- **Multer**（メモリストレージでのファイルアップロード）
- **PayPay Node SDK**（`@paypayopa/paypayopa-sdk-node`）
- **SSE (Server-Sent Events)**

---

## ✨ 機能一覧（Features & API）

---

## 1. 管理者の商品管理

管理者は商品を追加・更新・削除できます。

### 機能内容
- 商品画像（トップ画像 + 複数ギャラリー画像）を Firebase Storage に保存
- 商品情報を Firestore の `products` コレクションに登録
- 全商品の取得 / 公開中の商品だけを取得
- 商品ステータス（`active` / `inactive`）の変更
- 商品削除

### **API エンドポイント**

- `POST /api/upload`（管理者）
  - FormData:
    - `homepage`（必須）
    - `gallery`（任意・複数可）
    - `name`, `description`, `price`
- `GET /api/products`
- `GET /api/products/:id`
- `DELETE /api/products/:id`（管理者）
- `GET /api/active-products`
- `PATCH /api/products/:id/status`（管理者）

---

## 2. ユーザー注文管理

ユーザーの注文作成、注文履歴、管理者による注文管理をサポート。

### 機能内容
- ユーザーが注文を作成
- ユーザー自身の注文一覧・単一注文を取得
- 管理者が全注文を閲覧可能
- 決済状態の更新
- 発送状態・追跡番号の更新

### **API エンドポイント**

- `POST /api/orders`
  ```json
  {
    "orderItems": [...],
    "totalPrice": 1234,
    "address": "xxx",
    "phone": "090-xxxx-xxxx"
  }

	•	GET /api/orders
	•	GET /api/orders/:id
	•	DELETE /api/orders/:id
	•	GET /api/admin/orders（管理者）
	•	PATCH /api/orders/:id/pay
	•	PATCH /api/orders/:id/ship（管理者）

⸻

3. PayPay 決済連携

PayPay の ORDER_QR を用いた QR コード決済に対応。

フロー
	1.	ユーザーが QR コードの生成をリクエスト
	2.	PayPay から QR URL を取得
	3.	決済完了時に PayPay Webhook が実行
	4.	Firestore の注文 paymentStatus を自動更新
	5.	SSE を通してフロントに「支払い完了」を通知

API エンドポイント
	•	POST /api/orders/:orderId/paypay-create
	•	paypayPaymentId, paypayQrUrl, paypayStatus を注文に保存
	•	POST /（Webhook）
	•	state === "COMPLETED" の場合：
	•	SSE に { message: "支払いが完了しました" } を送信
	•	該当注文の paymentStatus = "已支付" に更新

⸻

4. SSE（リアルタイム通知）

決済完了をリアルタイムにフロントへ送信。
	•	GET /sse
	•	SSE 接続開始
	•	決済完了時、自動でプッシュ通知

⚠ Cloud Functions では長時間接続に制限があるため、軽量通知用途のみ推奨。

⸻

5. 管理者判定

管理者であるかを判定するための API。
	•	GET /admin/verify
	•	判定:

decodedToken.email === ADMIN_EMAIL



⸻

🔐 認証と権限（Auth & Permissions）

すべての保護された API は以下のヘッダーが必要です：

Authorization: Bearer <Firebase ID Token>

権限ルール：

👤 一般ユーザー
	•	注文作成
	•	自分の注文の閲覧 / 削除
	•	PayPay QR コード生成のリクエスト

👑 管理者（ADMIN_EMAIL 一致）
	•	商品の追加 / 削除
	•	商品ステータス変更
	•	全注文の閲覧
	•	発送管理（発送状態 + 追跡番号）
	•	任意の注文削除

