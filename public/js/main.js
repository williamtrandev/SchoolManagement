

$(function () {

    // Spinner
    var spinner = function () {
        setTimeout(function () {
            if ($('#spinner').length > 0) {
                $('#spinner').removeClass('show');
            }
        }, 1);
    };
    spinner();
    
    
    
    $('.back-to-top').click(function () {
        $('html, body').animate({scrollTop: 0}, 1500, 'easeInOutExpo');
        return false;
    });


    // Sidebar Toggler
    $('.sidebar-toggler').click(function () {
        $('.sidebar, .content').toggleClass("open");
        return false;
    });

    
    // Bắt sự kiện khi người dùng nhấn vào biểu tượng chỉnh sửa
    $('.edit-icon').click(function () {
        // Hiển thị form chỉnh sửa thông tin hoặc thực hiện các tác vụ cần thiết
        alert("Hiển thị form chỉnh sửa thông tin");
    });

    // Bắt sự kiện khi người dùng nhấn vào biểu tượng xóa
    $('.delete-icon').click(function () {
        // Thực hiện xóa dữ liệu hoặc các tác vụ cần thiết
        alert("Xóa thông tin");
    });
    
});

