import { animals } from "../animals.js"; // Import an array of animal names from an external file
import * as dotenv from "dotenv";
dotenv.config();
document.addEventListener("DOMContentLoaded", () => {
  // Wait for the DOM to be fully loaded before running the code
  const canvas = document.getElementById("canvas"); // Get the canvas element
  const context = canvas.getContext("2d"); // Get the canvas context
  canvas.style.opacity = 0; // Set the initial opacity of the canvas to 0

  setTimeout(() => {
    canvas.style.opacity = 1; // Gradually increase the opacity of the canvas over 1 second
  }, 1000); // Wait 1 second before running the function

  const processImage = async (blobImage) => {
    // Define a function to process the uploaded image
    const subscriptionKey = process.env.SUBSCRIPTION_KEY; // Define the subscription key for the Azure Computer Vision API
    const endpoint = process.env.ENDPOINT; // Define the endpoint for the Azure Computer Vision API
    const uriBase = endpoint + "vision/v3.2/analyze"; // Define the uriBase for the API request

    const params = {
      // Define the parameters for the API request
      visualFeatures: "Categories,Description,Color",
      details: "",
      language: "en",
    };

    try {
      const resizedBlob = await resizeImage(blobImage, 1000, 1000, 0.7); // Resize the image to a maximum of 1000x1000 pixels and reduce its quality to 70%
      const response = await fetch(
        uriBase + "?" + new URLSearchParams(params), // Send the API request with the defined parameters
        {
          method: "POST",
          headers: {
            "Content-Type": "application/octet-stream",
            "Ocp-Apim-Subscription-Key": subscriptionKey, // Include the subscription key in the request headers
          },
          body: resizedBlob, // Include the resized image in the request body
        }
      );
      const data = await response.json(); // Parse the response as JSON

      const fullCaption = data?.description?.captions?.[0]?.text ?? ""; // Get the full caption of the image
      document.getElementById("AIresponse").innerHTML = fullCaption; // Display the full caption in the HTML element with id "AIresponse"

      let animalName = "";
      for (const name of animals) {
        // Loop through the array of animal names
        // Check if the singular or plural form of the animal name is included in the caption
        const regex = new RegExp(`\\b${name}(s)?\\b`, "i");
        if (regex.test(fullCaption)) {
          animalName = name; // If a match is found, set animalName to the name of the animal
          break; // Exit the loop once a match is found
        }
      }
      document.getElementById("animalName").innerHTML =
        animalName || "Animal not recognized"; // Display the recognized animal name in the HTML element with id "animalName", or "Animal not recognized" if no match was found

      canvas.style.opacity = 1; // Reset the opacity of the canvas to 1
    } catch (error) {
      document.getElementById(
        "AIresponse"
      ).innerHTML = `Error processing image: ${error}`; // Display an error message in the HTML element with id "AIresponse" if an error occurs
    }
  };

  const handleFileSelect = (evt) => {
    // Define a function to handle the file select event
    const files = evt.target.files;
    const file = files[0];

    // Clear the animalName and AIresponse elements
    document.getElementById("animalName").innerHTML = "";
    document.getElementById("AIresponse").innerHTML = "";

    if (file.type.match("image.*")) {
      // Check if the selected file is an image
      const reader = new FileReader();

      reader.onload = (event) => {
        // When the file is loaded, create an image element and process the image
        const img = new Image();
        img.onload = () => {
          context.clearRect(0, 0, canvas.width, canvas.height); // Clear the canvas
          canvas.width = img.width;
          canvas.height = img.height;
          context.drawImage(img, 0, 0); // Draw the image on the canvas
          canvas.toBlob((blob) => {
            // Convert the canvas to a Blob object and process the image
            processImage(blob);
          });
        };
        img.src = event.target.result; // Set the source of the image element to the result of the file reader
      };
      reader.readAsDataURL(file); // Read the selected file as a data URL
    }
  };

  document
    .getElementById("fileinput")
    .addEventListener("change", handleFileSelect); // Add an event listener for the file select event

  document.getElementById("fileinput").addEventListener("click", () => {
    canvas.style.opacity = 0; // When the file input is clicked, set the opacity of the canvas to 0
  });
});

const resizeImage = (blob, maxWidth, maxHeight, quality) => {
  // Define a function to resize an image and return it as a Blob object
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.src = URL.createObjectURL(blob);

    img.onload = () => {
      // When the image is loaded, resize it and return it as a Blob object
      let width = img.width;
      let height = img.height;

      if (width > height) {
        if (width > maxWidth) {
          height *= maxWidth / width;
          width = maxWidth;
        }
      } else {
        if (height > maxHeight) {
          width *= maxHeight / height;
          height = maxHeight;
        }
      }

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          resolve(blob); // Resolve the promise with the resized image as a Blob object
        },
        "image/jpeg",
        quality
      );
    };

    img.onerror = reject;
  });
};
