export function parseTransformations(str = "") {
  const options = {};

  const parts = str.split(",");

  for (const part of parts) {
    const [key, value] = part.split("-");

    switch (key) {
      case "w":
        options.width = Number(value);
        break;

      case "h":
        options.height = Number(value);
        break;

      case "q":
        options.quality = Number(value);
        break;

      case "fit":
        options.fit = value;
        break;

      case "fmt":
        options.format = value;
        break;
    }
  }

  return options;
}