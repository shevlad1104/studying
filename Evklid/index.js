let burger = document.querySelector('.header__mobile-menu-link');
let menu = document.querySelector('.header__nav');
let close_menu_link = document.querySelector('.header__nav-link-x');
let menu_links = document.querySelectorAll('.header__nav-link');
let headerNavItems = document.querySelectorAll('.header__nav-item');
let tabsStepLinks = document.querySelectorAll('.working__step-link');
let tabsStepItems = document.querySelectorAll('.working__tabs-step-item');
let tabsStepImgs = document.querySelectorAll('.working__tabs-step-img');
let headerSearchWrapper = document.querySelector('.header__search-wrapper');
let headerInputSearch = document.querySelector('.header__input-search');
let headerSearchLink = document.querySelector('.header__search-link');
let headerCloseSearchLink = document.querySelector('.header__close-search-link');
let headerLaunchSearchLink = document.querySelector('.header__launch-search-link');
let faqLinks = document.querySelectorAll('.faq__link');
let faqQuestions = document.querySelectorAll('.faq__question');
let footerLabelPersonal = document.querySelector('.footer__label-personal');
let footerInputPersonal = document.querySelector('.footer__input-personal')

burger.addEventListener('click',

  function () {
    menu.classList.toggle('header__nav_active');

    document.body.classList.toggle('header__nav-stop-scroll');
  })

close_menu_link.addEventListener('click',

  function (events) {
    menu.classList.remove('header__nav_active');

    document.body.classList.remove('header__nav-stop-scroll');

    events.preventDefault();
  })

menu_links.forEach(function (menu_link) {

  menu_link.addEventListener('click',

    function () {
      menu.classList.remove('header__nav_active');

      document.body.classList.remove('header__nav-stop-scroll');
    })
})

let swiper = new Swiper('.swiper', {
  loop: true,
  spaceBetween: 1,
  slidesPerView: 1,
  slidesPerGroup: 1,
  pagination: {
    el: '.swiper-pagination',
    type: 'bullets',
    bulletElement: 'a',
    bulletClass: 'hero__bullet-link',
    bulletActiveClass: 'hero__bullet-link_active',
    clickable: true,
  },
})

tabsStepLinks.forEach(function (linkToClick) {
  linkToClick.addEventListener('click', function (event) {
    const path = event.currentTarget.dataset.path;

    //disabling link action
    event.preventDefault();

    //changing active link of steps
    tabsStepLinks.forEach(function (linkToChange) {
      linkToChange.classList.remove('working__step-link_active');
    });

    event.currentTarget.classList.add('working__step-link_active');

    //changing active item
    tabsStepItems.forEach(function (stepItem) {
      if (stepItem.dataset.target == path) {
        stepItem.classList.add('working__tabs-step-item_active');
      }
      else {
        stepItem.classList.remove('working__tabs-step-item_active');
      }
    });

    //changing active img of item
    tabsStepImgs.forEach(function (stepImg) {
      if (stepImg.dataset.target == path) {
        stepImg.classList.add('working__tabs-step-img_active');
      }
      else {
        stepImg.classList.remove('working__tabs-step-img_active');
      }
    });

  })
});

let faqAccordion = new Accordion('.accordion-container', {
  elementClass: 'faq__question',
  triggerClass: 'faq__link',
  panelClass: 'faq__ac-panel'
});

headerSearchLink.addEventListener('click', function (event) {

  //disabling link action
  event.preventDefault();

  //add class
  headerSearchWrapper.classList.toggle('header__search-wrapper_visible');

})

headerCloseSearchLink.addEventListener('click', function (event) {

  //disabling link action
  event.preventDefault();

  //remove class
  headerSearchWrapper.classList.remove('header__search-wrapper_visible');

})

headerLaunchSearchLink.addEventListener('click', function (event) {

  //disabling link action
  event.preventDefault();

})

faqLinks.forEach(function (faqLink) {
  faqLink.addEventListener('keydown', function (event) {

    //handle keydown Enter
    if (event.keyCode == 13) {

      //disabling default key action
      event.preventDefault();

      //get collection of questions and current question
      let faqQuestionsCollect = event.target.closest('.faq__questions-list').children;
      let faqQuestion = event.target.closest('.faq__question');

      //get index of current question
      let indexOfCurQuestion = Array.from(faqQuestionsCollect).indexOf(faqQuestion)

      if (faqQuestion.classList.contains('is-active')) {

        //pressed enter on curr question, just close it
        faqAccordion.close(indexOfCurQuestion);

      } else {

        //pressed enter on closed question, so close all questions before open it
        for (let index = 0; index < faqQuestionsCollect.length; index++) {
          faqAccordion.close(index);
        };

        //open current question
        faqAccordion.open(indexOfCurQuestion);

      }
    }

  })
})

menu_links.forEach(function (menuLink) {
  menuLink.addEventListener('keydown', function (event) {

    //handle keydown Tab without shift and with burger on display (means mobile menu is accessible)
    //to jump onto the top of the menu
    if ((!event.shiftKey)
      && (event.keyCode == 9)
      && (window.getComputedStyle(burger).display != 'none')) {

      //get current headerNavItem and index of current headerNavItem
      let headerCurNavItem = event.target.closest('.header__nav-item');
      let indexOfCurNavItem = Array.from(headerNavItems).indexOf(headerCurNavItem);

      if (indexOfCurNavItem == headerNavItems.length - 1) {

        //disabling default key action
        event.preventDefault();

        //focus on closing link (first in menu)
        close_menu_link.focus();
      };

    };

  })
});


close_menu_link.addEventListener('keydown', function (event) {

  //handle keydown Tab with shift and with burger on display (means mobile menu is accessible)
  //to jump onto the bottom of the menu
  if ((event.shiftKey)
    && (event.keyCode == 9)
    && (window.getComputedStyle(burger).display != 'none')) {

    //disabling default key action
    event.preventDefault();

    //get last headerNavItem and and focus on its link
    let lastHeaderNavItem = headerNavItems[headerNavItems.length - 1];
    let headerNavLink = lastHeaderNavItem.querySelector('.header__nav-link');
    headerNavLink.focus();

  };

});

headerCloseSearchLink.addEventListener('keydown', function (event) {

  //handle keydown Tab without shift and with visible headerSearchWrapper (means search bar is visible)
  //to jump onto the top of the search bar
  if ((!event.shiftKey)
    && (event.keyCode == 9)
    && (window.getComputedStyle(headerSearchWrapper).visibility != 'hidden')) {

    //disabling default key action
    event.preventDefault();

    //focus on search form
    headerInputSearch.focus();

  };

});

headerInputSearch.addEventListener('keydown', function (event) {

  //handle keydown Tab with shift and with visible headerSearchWrapper (means search bar is visible)
  //to jump onto the bottom of the search bar
  if ((event.shiftKey)
    && (event.keyCode == 9)
    && (window.getComputedStyle(headerSearchWrapper).visibility != 'hidden')) {

    //disabling default key action
    event.preventDefault();

    //focus on closing link
    headerCloseSearchLink.focus();

  };

});

function setAriaLabel_footerLabelPersonal(element, stateValue) {

  if (stateValue) {
    footerLabelPersonal.setAttribute('aria-checked', true);
    footerLabelPersonal.setAttribute('aria-label', 'Согласие на обработку данных отмечено');
  } else {
    footerLabelPersonal.setAttribute('aria-checked', false);
    footerLabelPersonal.setAttribute('aria-label', 'Согласие на обработку данных не отмечено');
  }

}

footerLabelPersonal.addEventListener('click', function (event) {

  let stateToSet = !footerInputPersonal.checked;
  setAriaLabel_footerLabelPersonal(footerInputPersonal, stateToSet);

});

footerLabelPersonal.addEventListener('keydown', function (event) {

  //handle keydown Enter or Space
  if ((event.keyCode == 13)
    || (event.keyCode == 32)) {

    //disabling default key action
    event.preventDefault();

    // //click the label
    event.target.click();
    // footerInputPersonal.checked = true;
    // setAriaLabel_footerLabelPersonal(footerInputPersonal, footerInputPersonal.checked);
  }

});
