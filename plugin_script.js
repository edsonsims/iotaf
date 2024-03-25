const menu = $('#navbarCollapse > ul > li:nth-child(2)');

function generateBreadcrumb(menuItem, breadcrumb = '') {
  const currentUrl = window.location.href;
  const markAsDone = (href) => localStorage.getItem(href) === 'watched';

  function processMenuItem(item, breadcrumb) {
    const children = $(item).children('ul').children('li');
    return Array.from(children).map((child) => {
      const anchor = $(child).children('a');
      const text = anchor.text().trim();
      const textBread = text.replace(/[^\w\s]/gi, '').replace(/\s+/g, '').replace(/\//g, '');
      const href = anchor.attr('href');
      const newBreadcrumb = breadcrumb + '/' + textBread;
      const modifiedHref = href.includes('#') ? href.replace(/#.*/, '#' + newBreadcrumb) : href + '#' + newBreadcrumb;
      anchor.attr('href', modifiedHref); // Update the href attribute in the HTML

      // Mark as active and done
      if (modifiedHref === currentUrl) {
        $(child).addClass('active');
        $(item).addClass('active');
        let parent = $(item).parent();
        while (parent.is('ul') && !parent.parent().is('#navbarCollapse')) {
          parent.parent().addClass('active');
          parent = parent.parent().parent();
        }
      }
      if (markAsDone(modifiedHref)) {
        $(child).addClass('done');
      }

      const subItems = $(child).children('ul').length > 0 ? processMenuItem(child, newBreadcrumb) : [];
      const allChildrenDone = subItems.length > 0 && subItems.every(subItem => subItem.done);
      if (allChildrenDone) {
        $(child).addClass('done');
      }
      return {
        text: text,
        href: modifiedHref,
        children: subItems,
        done: markAsDone(modifiedHref) || allChildrenDone
      };
    });
  }

  return processMenuItem(menuItem, breadcrumb);
}

const menuArray = generateBreadcrumb(menu);

function findMenuInArray(array, href) {
  for (const item of array) {
    if (item.href === href) return item;
    if (item.children.length) {
      const found = findMenuInArray(item.children, href);
      if (found) return found;
    }
  }
  return null;
}




function findPreviousAndNext(array, current) {
  let previous = null, next = null, found = false;

  function find(item, current, isCurrentFound) {
    if (item === current) {
      found = true;
      return;
    }
    if (!found && !item.href.startsWith('#')) {
      previous = item;
    }
    if (found && !next && !item.href.startsWith('#')) {
      next = item;
      return true;
    }
    for (const child of item.children) {
      if (find(child, current, found)) break; 
    }
  }

  for (const item of array) {
    if (find(item, current, found)) break;
  }

  return { previous, next, found };
}

function getCurrentMenuInfo() {
  const currentHref = window.location.href;
  const currentMenu = findMenuInArray(menuArray, currentHref);
  if (!currentMenu) {
    return null;
  }
  const { previous, next } = findPreviousAndNext(menuArray, currentMenu);
  return {
    current: currentMenu,
    previous: previous,
    next: next
  };
}

const currentMenuInfo = getCurrentMenuInfo();

$('.content-wrapper .content').append('<div class="container-fluid"><div id="video-details"></div></div>');
const detailsContainer = $('#video-details');

if (currentMenuInfo) {
  if (currentMenuInfo.current) {
    const watchedStatus = localStorage.getItem(currentMenuInfo.current.href) === 'watched';
    const statusLabel = watchedStatus ? 'Watched' : 'Not Watched';
    const buttonLabel = watchedStatus ? 'Mark as Pending' : 'Mark as Done';
    detailsContainer.append(`
      <h1>${currentMenuInfo.current.text}
        <span class="status-label ${watchedStatus ? 'watched' : 'not-watched'}">${statusLabel}</span>
        <button class="toggle-status">${buttonLabel}</button>
      </h1>
    `);
    $('.toggle-status').on('click', function() {
      const isWatched = $('.status-label').hasClass('watched');
      const newStatus = isWatched ? 'not-watched' : 'watched';
      const newStatusLabel = isWatched ? 'Not Watched' : 'Watched';
      const newButtonLabel = isWatched ? 'Mark as Done' : 'Mark as Pending';
      $('.status-label').removeClass('watched not-watched').addClass(newStatus).text(newStatusLabel);
      $(this).text(newButtonLabel);
      localStorage.setItem(currentMenuInfo.current.href, newStatus);
    });
  }
  if (currentMenuInfo.previous) {
    detailsContainer.append(`<a href="${currentMenuInfo.previous.href}" style="padding:20px;">Previous: ${currentMenuInfo.previous.text}</a>`);
  }
  if (currentMenuInfo.next) {
    detailsContainer.append(`<a href="${currentMenuInfo.next.href}">Next: ${currentMenuInfo.next.text}</a>`);
  }
}

const styleSheet = `
  .status-label.watched {
    font-size: 16pt;
    background: green !important;
    color: #ffffff;
    border-radius: 5px;
    padding: 5px 15px;
    margin: 0 15px;
    display: inline-block;
  }

  .status-label.not-watched {
    font-size: 16pt;
    background: gray !important;
    color: #ffffff;
    border-radius: 5px;
    padding: 5px 15px;
    margin: 0 15px;
    display: inline-block;
  }

  .toggle-status {
    font-size: 16pt;
    background: #007bff;
    color: #ffffff;
    border-radius: 5px;
    padding: 5px 15px;
    margin: 0 15px;
    border: none;
    cursor: pointer;
  }

  li.done a {
    font-weight: bold;
    color: #5fe95f !important;
  }

  ul.active, li.active, a.active {
    background-color: #f0f0f0;
    border-left: 3px solid #007bff;
  }
`;

const styleTag = document.createElement('style');
styleTag.type = 'text/css';
styleTag.appendChild(document.createTextNode(styleSheet));
document.head.appendChild(styleTag);

detailsContainer.css({
  'background-color': 'rgb(39 39 39)',
  'padding': '20px',
  'border-radius': '5px',
  'margin': '20px'
});

$('.dark-mode .content-wrapper').css('background', 'black');
$('.quiz').removeClass('col-mid-6').addClass('col-md-9')