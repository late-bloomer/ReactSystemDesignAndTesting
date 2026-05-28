import { render, screen, within, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ImageCarousel from "../components/custom-image-carousel/ImageCarousel";

const mockImages = [
  "https://example.com/img1.jpg",
  "https://example.com/img2.jpg",
  "https://example.com/img3.jpg",
];

beforeEach(() => {
  global.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
});

describe("ImageCarousel", () => {
  test("renders heading and duration input", async () => {
    render(<ImageCarousel />);
    expect(
      screen.getByRole("heading", { name: /image carousel/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText(/enter in seconds/i),
    ).toBeInTheDocument();
    await waitFor(() =>
      expect(screen.getByText(/Gallery - Image 1/i)).toBeInTheDocument(),
    );
  });

  test("loads images from the API and shows first image as selected", async () => {
    render(<ImageCarousel />);
    await waitFor(() => {
      expect(screen.getByText(/Gallery - Image 1/i)).toBeInTheDocument();
    });
    const projected = screen.getByAltText("Image");
    expect(projected).toHaveAttribute("src", mockImages[0]);
  });

  test("clicking forward arrow advances to next image", async () => {
    const user = userEvent.setup();
    render(<ImageCarousel />);
    await waitFor(() =>
      expect(screen.getByText(/Gallery - Image 1/i)).toBeInTheDocument(),
    );

    const projected = screen.getByAltText("Image").closest(".projected-image");
    await user.click(within(projected).getByRole("button", { name: ">" }));
    expect(screen.getByText(/Gallery - Image 2/i)).toBeInTheDocument();
  });

  test("clicking backward arrow from first image wraps to last", async () => {
    const user = userEvent.setup();
    render(<ImageCarousel />);
    await waitFor(() =>
      expect(screen.getByText(/Gallery - Image 1/i)).toBeInTheDocument(),
    );

    const projected = screen.getByAltText("Image").closest(".projected-image");
    await user.click(within(projected).getByRole("button", { name: "<" }));
    expect(
      screen.getByText(new RegExp(`Gallery - Image ${mockImages.length}`, "i")),
    ).toBeInTheDocument();
  });

  test("duration input updates when user types", async () => {
    const user = userEvent.setup();
    render(<ImageCarousel />);
    const input = screen.getByPlaceholderText(/enter in seconds/i);
    await user.type(input, "5");
    expect(input).toHaveValue("5");
  });

  test("toggling direction radio switches selection", async () => {
    const user = userEvent.setup();
    render(<ImageCarousel />);
    const [forward, backward] = screen.getAllByRole("radio");
    expect(forward).toBeChecked();
    expect(backward).not.toBeChecked();

    await user.click(backward);
    expect(backward).toBeChecked();
    expect(forward).not.toBeChecked();
  });
});
