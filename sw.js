importScripts("/third_party/workbox-v6.5.4/workbox-sw.js");
importScripts("/third_party/idb-keyval.js");

class Node {
  constructor(value) {
    this.value = value;
    this.next = null;
    this.previous = null;
  }
}

class DoublyLinkedList {
  constructor(value) {
    this.head = {
      value: value,
      next: null,
      previous: null,
    };
    this.length = 1;
    this.tail = this.head;
  }

  append(value) {
    let newNode = new Node(value);

    this.tail.next = newNode;
    newNode.previous = this.tail;
    this.tail = newNode;

    this.length++;
    return newNode;
  }

  prepend(value) {
    let newNode = new Node(value);

    newNode.next = this.head;
    this.head.previous = newNode;
    this.head = newNode;

    this.length++;
    return newNode;
  }

  insert(index, value) {
    if (!Number.isInteger(index) || index < 0 || index > this.length + 1) {
      console.error(`Invalid index. Current length is ${this.length}.`);
      return this;
    }

    if (index === 0) {
      this.prepend(value);
      return this;
    }

    if (index === this.length) {
      this.append(value);
      return this;
    }

    let newNode = new Node(value);
    let previousNode = this.head;

    for (let k = 0; k < index - 1; k++) {
      previousNode = previousNode.next;
    }

    let nextNode = previousNode.next;

    newNode.next = nextNode;
    previousNode.next = newNode;
    newNode.previous = previousNode;
    nextNode.previous = newNode;

    this.length++;
  }

  pop(index) {
    if (!Number.isInteger(index) || index < 0 || index > this.length) {
      console.error(`Invalid index. Current length is ${this.length}.`);
      return this;
    }

    // Remove head
    if (index === 0) {
      this.head = this.head.next;
      this.head.previous = null;

      this.length--;
      return this;
    }

    // Remove tail
    if (index === this.length - 1) {
      this.tail = this.tail.previous;
      this.tail.next = null;

      this.length--;
      return this;
    }

    // Remove node at an index
    let previousNode = this.head;

    for (let k = 0; k < index - 1; k++) {
      previousNode = previousNode.next;
    }
    let deleteNode = previousNode.next;
    let nextNode = deleteNode.next;

    previousNode.next = nextNode;
    nextNode.previous = previousNode;

    this.length--;
    return;
  }

  remove(node) {
    node.prev.next = node.next;
    node.next.prev = node.prev;
    this.length--;
  }
}

workbox.setConfig({
  modulePathPrefix: "/third_party/workbox-v6.5.4/",
});

const IDB_LRU_CACHE_KEY = "image-assets";
const SHIFT_QUEUE = [];

workbox.routing.registerRoute(
  ({ request, url }) =>
    request.destination === "image" &&
    url.origin === "https://redditlattice-server-production.up.railway.app",
  new workbox.strategies.CacheFirst({
    cacheName: "images-assets",
    fetchOptions: {
      mode: "cors",
    },
    plugins: [
      {
        cacheDidUpdate: async ({ request, response }) => {
          /* console.log("SERVICE-WORKER:WillUpdate", { request, response }); */
          await idbKeyval.update(IDB_LRU_CACHE_KEY, (cacheDb) => {
            cacheDb = cacheDb || {
              urls: new DoublyLinkedList(),
              map: new Map(),
              limit: 500,
            };
            if (!cacheDb.urls) cacheDb.urls = new DoublyLinkedList();
            if (!cacheDb.map) cacheDb.map = new Map();
            if (cacheDb.urls.length + 1 > cacheDb.limit) {
              const url = cacheDb.urls.tail.value;
              cacheDb.urls.remove(cacheDb.urls.length - 1);
              if (key)
                caches.open("images-assets").then((cache) => {
                  cache.delete(url);
                });
            }
            const node = cacheDb.urls.append(request.url);
            cacheDb.map.set(request.url, node);
            return cacheDb;
          });
          return response;
        },
        cachedResponseWillBeUsed: async ({ request, response }) => {
          /* console.log("SERVICE-WORKER:WillBeUsed", { request, response }); */
          await idbKeyval.update(IDB_LRU_CACHE_KEY, (cacheDb) => {
            cacheDb = cacheDb || {
              urls: new DoublyLinkedList(),
              map: new Map(),
              limit: 500,
            };
            if (!cacheDb.urls) cacheDb.urls = new DoublyLinkedList();
            if (!cacheDb.map) cacheDb.map = new Map();
            const node = cacheDb.map.get(request.url);
            if (node) {
              cacheDb.urls.remove(node);
              cacheDb.urls.append(node);
            }
            return cacheDb;
          });
          return response;
        },
      },
    ],
  })
);

workbox.precaching.precacheAndRoute(self.__WB_MANIFEST);
