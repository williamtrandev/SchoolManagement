

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

    
    
});

function announcementDateFormat(dateStr) {
    const date = new Date(dateStr);
    const year = date.getFullYear();
    let month = date.getMonth() + 1;
    if (month < 10) {
        month = '0' + month;
    }
    let day = date.getDate();
    if (day < 10) {
        day = '0' + day;
    }
    let hour = date.getHours();
    if (hour < 10) {
        hour = '0' + hour;
    }
    let minute = date.getMinutes();
    if (minute < 10) {
        minute = '0' + minute;
    }
    return `${day}/${month}/${year} ${hour}:${minute}`;
}

function localDateTimeString(dateStr) {
    const date = new Date(dateStr);
    const year = date.getFullYear();
    let month = date.getMonth() + 1;
    if (month < 10) {
        month = '0' + month;
    }
    let day = date.getDate();
    if (day < 10) {
        day = '0' + day;
    }
    let hour = date.getHours();
    if (hour < 10) {
        hour = '0' + hour;
    }
    let minute = date.getMinutes();
    if (minute < 10) {
        minute = '0' + minute;
    }
    return `${year}-${month}-${day}T${hour}:${minute}`;
}

if ($('#changeStudentPasswordBtn').length) {
    $('#changeStudentPasswordBtn').click(() => {
        const oldPassword = $('#oldPassword').val();
        const newPassword = $('#newPassword').val();
        if (oldPassword == '' || newPassword == '') {
            toastr.error('Mật khẩu không được để trống');
            return;
        }
        const body = { oldPassword, newPassword };

        fetch('/student/change-password', {
            method: 'POST',
            headers: {
                'Content-Type':'application/json'
            },
            body: JSON.stringify(body),
        })
        .then(res => res.json())
        .then(data => {
            if (data.error) {
                toastr.error(data.error);
            } else {
                $('#changePasswordModal').modal('hide');
                toastr.success(data.success);
            }
        })
        .catch(err => {
            toastr.error('Có lỗi trong quá trình đổi mật khẩu');
        });
    });
}

if ($('#changeTeacherPasswordBtn').length) {
    $('#changeTeacherPasswordBtn').click(() => {
        const oldPassword = $('#oldPassword').val();
        const newPassword = $('#newPassword').val();
        if (oldPassword == '' || newPassword == '') {
            toastr.error('Mật khẩu không được để trống');
            return;
        }
        const body = { oldPassword, newPassword };

        fetch('/teacher/change-password', {
            method: 'POST',
            headers: {
                'Content-Type':'application/json'
            },
            body: JSON.stringify(body),
        })
        .then(res => res.json())
        .then(data => {
            if (data.error) {
                toastr.error(data.error);
            } else {
                $('#changePasswordModal').modal('hide');
                toastr.success(data.success);
            }
        })
        .catch(err => {
            toastr.error('Có lỗi trong quá trình đổi mật khẩu');
        });
    });
}