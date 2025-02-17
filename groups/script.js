'use strict';
import { CANNOT_CONTAIN_GROUP, NO_SPACES_ALLOWED } from './constants.js';
import {
  removeGroupKeywordFromDiscordRoleName,
  getDiscordGroups,
  addGroupRoleToMember,
  createDiscordGroupRole,
  getUserSelf,
} from './utils.js';
const groupTabs = document.querySelector('.groups-tab');
const tabs = document.querySelectorAll('.groups-tab div');
const sections = document.querySelectorAll('.manage-groups, .create-group');
const loader = document.querySelector('.backdrop');
const userIsNotVerifiedText = document.querySelector('.not-verified-tag');
const userSelfData = await getUserSelf();

/**
 * Create DOM for "created by author" line under groupName
 *
 */
const createAuthorDetailsDOM = (firstName, lastName, imageUrl) => {
  const container = document.createElement('div');
  container.classList.add('created-by--container');
  const userAvatar = document.createElement('img');
  userAvatar.classList.add('created-by--avatar');
  userAvatar.src = imageUrl;
  userAvatar.setAttribute('alt', "group's creator image");

  const createdBy = document.createElement('span');
  createdBy.classList.add('created-by');
  createdBy.textContent = `created by ${firstName} ${lastName}`;

  container.appendChild(userAvatar);
  container.appendChild(createdBy);
  return container;
};

/**
 * GET SELF DATA
 */
const IsUserVerified = !!userSelfData.discordId;
const IsUserArchived = userSelfData.roles.archived;
if (!IsUserVerified || IsUserArchived) {
  userIsNotVerifiedText.classList.remove('hidden');
}
const memberAddRoleBody = {
  userid: userSelfData?.discordId,
  roleid: '',
};

/**
 *
 * FOR RENDERING GROUP ROLES IN 'MANAGE ROLES' TAB
 */
const groupsData = await getDiscordGroups();
const groupRoles = document.querySelector('.groups-list');
groupsData?.forEach((item) => {
  const group = document.createElement('li');
  group.setAttribute('id', item.roleid);
  group.classList.add('group-role');
  if (window.location.search.slice(1) === item.rolename) {
    group.classList.add('active-group');
  }

  const groupname = document.createElement('p');
  groupname.classList.add('group-name');
  groupname.setAttribute('id', `name-${item.roleid}`);
  groupname.setAttribute('data-member-count', item.memberCount);
  groupname.textContent = removeGroupKeywordFromDiscordRoleName(item.rolename);

  const createdBy = createAuthorDetailsDOM(
    item.firstName,
    item.lastName,
    item.image,
  );

  group.appendChild(groupname);
  group.appendChild(createdBy);
  groupRoles.appendChild(group);
});

/**
 * FOR RENDERING TABS
 * I.E. MANAGE ROLES, CREATE GROUP
 */
tabs?.forEach((tab, index) => {
  tab.addEventListener('click', (e) => {
    sections.forEach((section) => {
      section.classList.add('hidden');
    });
    sections[index].classList.remove('hidden');
  });
});

/**
 * FOR CHANGING TABS
 */
groupTabs.addEventListener('click', (e) => {
  tabs.forEach((tab) => {
    tab.classList?.remove('active-tab');
  });
  if (e.target.nodeName !== 'NAV') e.target?.classList?.add('active-tab');
});

/**
 * FOR SELECTING A GROUP
 */
const pathname = window.location.pathname;
const groupRolesList = document.querySelectorAll('.group-role');
groupRoles?.addEventListener('click', function (event) {
  groupRolesList.forEach((groupItem) => {
    window.history.pushState({}, '', pathname);
    groupItem.classList?.remove('active-group');
  });
  const groupListItem = event.target?.closest('li');
  if (groupListItem) {
    const newURL = `${window.location.pathname}?${
      groupListItem.querySelector('p').textContent
    }`;
    window.history.pushState({}, '', newURL);
    groupListItem.classList.add('active-group');
    memberAddRoleBody.roleid = groupListItem.id;
    if (IsUserVerified) {
      buttonAddRole.disabled = false;
    }
  }
});

// const paragraphElement = null, paragraphContent = '';
const searchInput = document.getElementById('search-groups');

function debounce(func, delay) {
  let timeoutId;
  return function (...args) {
    timeoutId = setTimeout(() => {
      clearTimeout(timeoutId);
      func.apply(this, args);
    }, delay);
  };
}

searchInput.addEventListener('keyup', () => {
  loader.classList.remove('hidden');
  debounce(() => {
    const searchValue = searchInput.value.toUpperCase();
    const groupRoles = document.querySelectorAll('.group-role');
    groupRoles.forEach((groupRole) => {
      const paragraphElement = groupRole.getElementsByTagName('p')[0];
      const paragraphContent = paragraphElement.textContent;
      const displayValue =
        paragraphContent.toUpperCase().indexOf(searchValue) > -1 ? '' : 'none';
      groupRole.style.display = displayValue;
      loader.classList.add('hidden');
    });
  }, 1000)();
});

/**
 * TO ASSIGN YOURSELF A ROLE
 */
const buttonAddRole = document.querySelector('.btn-add-role');
buttonAddRole.addEventListener('click', async function () {
  if (memberAddRoleBody?.userid && memberAddRoleBody?.roleid !== '') {
    loader.classList.remove('hidden');

    addGroupRoleToMember(memberAddRoleBody)
      .then((res) => {
        const groupNameElement = document.getElementById(
          `name-${memberAddRoleBody.roleid}`,
        );
        const currentCount =
          +groupNameElement.getAttribute('data-member-count');
        if (!isNaN(currentCount)) {
          groupNameElement.setAttribute('data-member-count', currentCount + 1);
        }
        alert(res.message);
      })
      .catch((err) => alert(err.message))
      .finally(() => loader.classList.add('hidden'));
  }
});

/**
 *
 * Create group roles section
 */
const createGroupButton = document.querySelector('.btn-create-group');
const inputNewGroupRole = document.querySelector('.new-group-input');

if (!IsUserVerified) {
  createGroupButton.disabled = true;
}

/**
 *
 * Check if group role is valid
 */

const isValidGroupRole = (rolename) => {
  const error = {
    valid: true,
    message: '',
  };
  if (rolename.includes('group')) {
    error.valid = false;
    error.message = CANNOT_CONTAIN_GROUP;
  }
  if (rolename.split(' ').length > 1) {
    error.valid = false;
    error.message = NO_SPACES_ALLOWED;
  }
  return error;
};

/**
 * CREATING A NEW GROUP ROLE
 */
createGroupButton.addEventListener('click', async () => {
  const inputValue = inputNewGroupRole?.value.trim();
  if (inputValue === '') return;

  const isValidRole = isValidGroupRole(inputValue);
  if (!isValidRole.valid) {
    alert(isValidRole.message);
    return;
  }

  loader?.classList?.remove('hidden');

  const groupRoleBody = { rolename: inputValue };
  createDiscordGroupRole(groupRoleBody)
    .then((res) => alert(res.message))
    .catch((err) => alert(err.message))
    .finally(() => {
      inputNewGroupRole.value = '';
      loader.classList.add('hidden');
      location.reload();
    });
});
