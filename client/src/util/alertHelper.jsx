import Swal from "sweetalert2"

export const Toast = Swal.mixin({
    toast: true,
    position: "top-end",
    showConfirmButton: false,
    timer: 3000,
    timerProgressBar: true,
    background: "#fffafa",
    didOpen: toast => {
        toast.addEventListener("mouseenter", Swal.stopTimer)
        toast.addEventListener("mouseleave", Swal.resumeTimer)
    },
})

export const showToast = (icon, title) => {
    Toast.fire({
        icon,
        title,
    })
}
