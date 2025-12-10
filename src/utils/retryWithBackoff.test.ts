jest.useFakeTimers();
import { retryWithBackoff } from "./retryWithBackoff";
import { externalApiLogger } from "../config/logger";

jest.mock("../config/logger", () => ({
  externalApiLogger: { error: jest.fn() },
}));

describe("retryWithBackoff", () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.clearAllTimers();
    jest.useRealTimers();
    jest.clearAllMocks();
  });

  test("should return result immediately when fn succeeds at first try", async () => {
    const fn = jest.fn().mockResolvedValue("OK");

    const promise = retryWithBackoff(fn);

    await expect(promise).resolves.toBe("OK");
    expect(fn).toHaveBeenCalledTimes(1);
    expect(externalApiLogger.error).not.toHaveBeenCalled();
  });

  test("should retry when fn fails once and then succeeds", async () => {
    const fn = jest
      .fn()
      .mockRejectedValueOnce(new Error("fail"))
      .mockResolvedValueOnce("OK");

    const promise = retryWithBackoff(fn);

    jest.runAllTimersAsync();

    await expect(promise).resolves.toBe("OK");
    expect(fn).toHaveBeenCalledTimes(2);
    expect(externalApiLogger.error).toHaveBeenCalledTimes(1);
  });

  test("should retry 5 times and finally throw error", async () => {
    const fn = jest.fn().mockRejectedValue(new Error("fail"));

    const promise = retryWithBackoff(fn, 5);

    jest.runAllTimersAsync();

    await expect(promise).rejects.toThrow("fail");
    expect(fn).toHaveBeenCalledTimes(5);
    expect(externalApiLogger.error).toHaveBeenCalledTimes(6);
  });

  test("should apply exponential delays", async () => {
    const fn = jest
      .fn()
      .mockRejectedValueOnce(new Error("fail"))
      .mockRejectedValueOnce(new Error("fail"))
      .mockResolvedValueOnce("OK");

    const setTimeoutSpy = jest.spyOn(global, "setTimeout");

    const promise = retryWithBackoff(fn, 3);

    await jest.runAllTimersAsync();

    const result = await promise;

    expect(result).toBe("OK");
    expect(setTimeoutSpy).toHaveBeenCalledTimes(2);
    expect(setTimeoutSpy).toHaveBeenNthCalledWith(
      1,
      expect.any(Function),
      1000
    );
    expect(setTimeoutSpy).toHaveBeenNthCalledWith(
      2,
      expect.any(Function),
      2000
    );
  });
});
