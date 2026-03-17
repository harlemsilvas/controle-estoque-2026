import { toast } from "react-toastify";

export const toastSuccess = (message) => {
  toast.success(message, {
    position: "bottom-right",
    autoClose: 3000,
    className: "bg-green-100 border border-green-400 text-green-700",
  });
};

export const toastError = (message) => {
  toast.error(message, {
    position: "bottom-right",
    autoClose: 4000,
    className: "bg-red-100 border border-red-400 text-red-700",
  });
};
