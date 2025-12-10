import { fetchOrders } from "./idosell.client";
import { externalApiLogger } from "../../config/logger";
import { APIOrder } from "./order.types";

jest.mock("../../config/logger", () => ({
  externalApiLogger: { error: jest.fn() },
}));

describe("fetchOrders", () => {
  let mockFetch: any = undefined;

  beforeEach(() => {
    jest.useFakeTimers();
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  const mockOrder: APIOrder = {
    orderId: "123",
    orderDetails: {
      orderStatus: "confirmed",
      orderChangeDate: "2024-01-01 10:00:00",
      productsResults: [
        { productId: 1, productQuantity: 2, productOrderPrice: 100 },
      ],
    },
  };

  test("returns parsed orders when fetch succeeds", async () => {
    mockFetch = jest.spyOn(global, "fetch").mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ Results: [mockOrder] }),
    } as any);

    const result = await fetchOrders(0, 100, "2024-01-01", "modified");

    expect(result).toEqual([mockOrder]);
    expect(mockFetch).toHaveBeenCalledTimes(1);
    expect(externalApiLogger.error).not.toHaveBeenCalled();
  });

  test("returns empty array when API returns no Results field", async () => {
    mockFetch = jest.spyOn(global, "fetch").mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({}),
    } as any);

    const result = await fetchOrders(0, 100, "2024-01-01", "modified");

    expect(result).toEqual([]);
  });

  test("throws when response.ok is false", async () => {
    mockFetch = jest.spyOn(global, "fetch").mockResolvedValue({
      ok: false,
      status: 500,
      json: () => Promise.resolve({ message: "error" }),
    } as any);

    await expect(fetchOrders(0, 100, "2024-01-01", "modified")).rejects.toThrow(
      "IdoSell returned error response: 500"
    );

    expect(externalApiLogger.error).toHaveBeenCalled();
  });

  test("throws when response.json() fails", async () => {
    mockFetch = jest.spyOn(global, "fetch").mockResolvedValue({
      ok: true,
      json: () => Promise.reject(new Error("Invalid JSON")),
    } as any);

    await expect(fetchOrders(0, 100, "2024-01-01", "modified")).rejects.toThrow(
      "Invalid JSON"
    );

    expect(externalApiLogger.error).toHaveBeenCalled();
  });

  test("throws when API returns malformed order structure", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ Results: [{ orderId: "broken" }] }),
    });

    await expect(
      fetchOrders(0, 100, "2024-01-01", "modified")
    ).rejects.toThrow();

    expect(externalApiLogger.error).toHaveBeenCalled();
  });

  test("aborts request when timeout triggers", async () => {
    mockFetch = jest.spyOn(global, "fetch").mockImplementation(
      (_url, options: any) =>
        new Promise((_resolve, reject) => {
          options.signal.addEventListener("abort", () => {
            queueMicrotask(() => reject(new Error("Aborted")));
          });
        })
    );

    const promise = fetchOrders(0, 100, "2024-01-01", "modified", 5000);

    jest.advanceTimersByTime(5001);

    await expect(promise).rejects.toThrow("Aborted");

    expect(mockFetch).toHaveBeenCalledTimes(1);
    expect(externalApiLogger.error).toHaveBeenCalled();
  });

  test("calls fetch with proper payload and headers", async () => {
    mockFetch = jest.spyOn(global, "fetch").mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ Results: [] }),
    } as any);

    await fetchOrders(1, 50, "2024-01-01", "add");

    const call = mockFetch.mock.calls[0];

    expect(call[1]).toMatchObject({
      method: "POST",
      headers: {
        "X-API-KEY": expect.any(String),
      },
    });

    const body = JSON.parse(call[1].body);

    expect(body.params.ordersRange.ordersDateRange).toEqual({
      ordersDateType: "add",
      ordersDateBegin: "2024-01-01",
    });
    expect(body.params.resultsPage).toBe(1);
    expect(body.params.resultsLimit).toBe(50);
  });
});
