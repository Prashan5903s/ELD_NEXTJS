export const safetyStatusOptions = [
  {
    label: "Pending review",
    icon: (
      <svg
        width="20px"
        height="20px"
        viewBox="0 0 20 20"
        fill="currentColor"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          fill-rule="evenodd"
          clip-rule="evenodd"
          d="M17.5 3.23778L10 1.875L2.5 3.23778V8.7559C2.5 14.0376 6.81005 16.9282 9.39218 18.125H10.6078C13.19 16.9282 17.5 14.0376 17.5 8.7559V3.23778ZM3.75 8.7559V4.28034L10 3.14469L16.25 4.28034V8.7559C16.25 13.3233 12.4579 15.9119 10 17.0295C7.54215 15.9119 3.75 13.3233 3.75 8.7559Z"
        ></path>
      </svg>
    ),
  },
  {
    label: "Coachable",
    icon: (
      <svg
        width="20px"
        height="20px"
        viewBox="0 0 20 20"
        fill="#b0cfb0"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path d="M10 8.13123C9.30964 8.13123 8.75 8.69053 8.75 9.38045C8.75 10.0704 9.30964 10.6297 10 10.6297C10.6904 10.6297 11.25 10.0704 11.25 9.38045C11.25 8.69053 10.6904 8.13123 10 8.13123Z"></path>
        <path
          fill-rule="evenodd"
          clip-rule="evenodd"
          d="M17.5 3.23778L10 1.875L2.5 3.23778V8.75592C2.5 14.0376 6.80996 16.9282 9.3921 18.125H10.6079C13.19 16.9282 17.5 14.0376 17.5 8.75592V3.23778ZM7.5 9.38045C7.5 8.0006 8.61929 6.88202 10 6.88202C11.3807 6.88202 12.5 8.0006 12.5 9.38045C12.5 10.7603 11.3807 11.8789 10 11.8789C8.61929 11.8789 7.5 10.7603 7.5 9.38045Z"
        ></path>
      </svg>
    ),
  },
  {
    label: "Coached",
    icon: (
      <svg
        width="20px"
        height="20px"
        viewBox="0 0 20 20"
        fill="#b0cfb0"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          fill-rule="evenodd"
          clip-rule="evenodd"
          d="M17.5 3.23778L10 1.875L2.5 3.23778V8.75592C2.5 14.0376 6.80996 16.9282 9.3921 18.125H10.6079C13.19 16.9282 17.5 14.0376 17.5 8.75592V3.23778ZM8.95833 11.9295L13.5669 7.32376L12.6831 6.44043L8.95833 10.1628L7.31694 8.52245L6.43306 9.40577L8.95833 11.9295Z"
        ></path>
      </svg>
    ),
  },
  {
    label: "Dismissed",
    icon: (
      <svg
        width="20px"
        height="20px"
        viewBox="0 0 20 20"
        fill="var(--phx-web-color-content-subdued)"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          fill-rule="evenodd"
          clip-rule="evenodd"
          d="M17.5 3.23778L10 1.875L2.5 3.23778V8.75592C2.5 14.0376 6.80996 16.9282 9.3921 18.125H10.6079C13.19 16.9282 17.5 14.0376 17.5 8.75592V3.23778ZM8.25445 12.0084L10 10.2639L11.7456 12.0084L12.6295 11.125L10.8839 9.38057L12.6295 7.6361L11.7456 6.75278L10 8.49724L8.25445 6.75278L7.37057 7.6361L9.11613 9.38057L7.37057 11.125L8.25445 12.0084Z"
        ></path>
      </svg>
    ),
  },
];

export const markerSVGs = {
  red: `<svg width="18px" height="18px" version="1.1" id="Capa_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" viewBox="0 0 396.433 396.433" style="margin-right: 20px;width: 20px;enable-background:new 0 0 396.433 396.433;" xml:space="preserve">
<path file="red" d="M375.345,152.655C255.313,116.943,137.343,78.915,35.325,3.875C16.849-9.716,0.701,15.563,7.566,31.636
	c48.861,114.446,90.3,231.237,127.888,349.823c6.304,19.899,34.264,20.031,40.536,0c16.386-52.336,37.152-114.487,23.508-169.351
	c56.81-5.213,113.603-11.136,170.232-17.962C392.229,191.436,399.784,159.925,375.345,152.655z" style="
    fill: red;
"></path>
</svg>`,
  lightRed: `<svg width="18px" height="18px" version="1.1" id="Capa_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" viewBox="0 0 396.433 396.433" style="width: 20px;enable-background:new 0 0 396.433 396.433;" xml:space="preserve">
<path file="red" d="M375.345,152.655C255.313,116.943,137.343,78.915,35.325,3.875C16.849-9.716,0.701,15.563,7.566,31.636
	c48.861,114.446,90.3,231.237,127.888,349.823c6.304,19.899,34.264,20.031,40.536,0c16.386-52.336,37.152-114.487,23.508-169.351
	c56.81-5.213,113.603-11.136,170.232-17.962C392.229,191.436,399.784,159.925,375.345,152.655z" style="
    fill: #d06767;
"></path>
</svg>`,
  orange: `<svg width="18px" height="18px" version="1.1" id="Capa_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" viewBox="0 0 396.433 396.433" style="width: 20px;enable-background:new 0 0 396.433 396.433;" xml:space="preserve">
<path file="red" d="M375.345,152.655C255.313,116.943,137.343,78.915,35.325,3.875C16.849-9.716,0.701,15.563,7.566,31.636
	c48.861,114.446,90.3,231.237,127.888,349.823c6.304,19.899,34.264,20.031,40.536,0c16.386-52.336,37.152-114.487,23.508-169.351
	c56.81-5.213,113.603-11.136,170.232-17.962C392.229,191.436,399.784,159.925,375.345,152.655z" style="
    fill: orange;
"></path>
</svg>`,
  yellow: `<svg width="18px" height="18px" version="1.1" id="Capa_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" viewBox="0 0 396.433 396.433" style="width: 20px;enable-background:new 0 0 396.433 396.433;" xml:space="preserve">
<path file="red" d="M375.345,152.655C255.313,116.943,137.343,78.915,35.325,3.875C16.849-9.716,0.701,15.563,7.566,31.636
	c48.861,114.446,90.3,231.237,127.888,349.823c6.304,19.899,34.264,20.031,40.536,0c16.386-52.336,37.152-114.487,23.508-169.351
	c56.81-5.213,113.603-11.136,170.232-17.962C392.229,191.436,399.784,159.925,375.345,152.655z" style="
    fill: yellow;
"></path>
</svg>`,
  green: `<svg width="18px" height="18px" version="1.1" id="Capa_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" viewBox="0 0 396.433 396.433" style="width: 20px;enable-background:new 0 0 396.433 396.433;" xml:space="preserve">
<path file="red" d="M375.345,152.655C255.313,116.943,137.343,78.915,35.325,3.875C16.849-9.716,0.701,15.563,7.566,31.636
	c48.861,114.446,90.3,231.237,127.888,349.823c6.304,19.899,34.264,20.031,40.536,0c16.386-52.336,37.152-114.487,23.508-169.351
	c56.81-5.213,113.603-11.136,170.232-17.962C392.229,191.436,399.784,159.925,375.345,152.655z" style="
    fill: green;
"></path>
</svg>`,
};

export const assignMarkerColors = (data) => {
  // Sort data by speed in descending order
  const sortedData = [...data].sort((a, b) => b.speed - a.speed);
  const colorBands = [
    markerSVGs.red,
    markerSVGs.lightRed,
    markerSVGs.orange,
    markerSVGs.yellow,
    markerSVGs.green,
  ];

  // Determine the number of items in each color band
  const bandSize = Math.ceil(sortedData.length / colorBands.length);

  sortedData.forEach((item, index) => {
    // Determine the color band based on index
    const colorIndex = Math.floor(index / bandSize);
    const color = colorBands[colorIndex] || markerSVGs.green;
    item.markerURL =
      "data:image/svg+xml;charset=UTF-8," + encodeURIComponent(color);
  });

  return sortedData;
};
