

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

function annoucementDateFormat(dateStr) {
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