/**
 * Domain handlers for image-related endpoints.
 *
 * Currently only handles the ImageCarousel's `./image.json` fetch — a regex
 * matcher catches it regardless of the resolved host (jsdom resolves the
 * relative URL against http://localhost/ by default).
 */
import { http, HttpResponse } from "msw";

export const imageHandlers = [
  http.get(/image\.json$/, () => {
    return HttpResponse.json({
      images: [
        "https://example.com/img1.jpg",
        "https://example.com/img2.jpg",
        "https://example.com/img3.jpg",
      ],
    });
  }),
];
