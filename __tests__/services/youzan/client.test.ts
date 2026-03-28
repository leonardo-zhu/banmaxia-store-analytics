import { YouzanClient } from "@/services/youzan/client";

describe("YouzanClient", () => {
  test("constructor sets cookie", () => {
    const client = new YouzanClient("test_cookie_123");
    expect(client.cookie).toBe("test_cookie_123");
  });

  test("buildHeaders includes cookie and content-type", () => {
    const client = new YouzanClient("my_cookie");
    const headers = client.buildHeaders();
    expect(headers["Cookie"]).toBe("my_cookie");
    expect(headers["Content-Type"]).toBe("application/json");
  });

  test("post and get methods exist", () => {
    const client = new YouzanClient("cookie");
    expect(typeof client.post).toBe("function");
    expect(typeof client.get).toBe("function");
    expect(typeof client.checkCookieValid).toBe("function");
  });
});
