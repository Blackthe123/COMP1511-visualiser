import type { LLNode, Frame, Variables } from './types';
import { CODE_INSERT, CODE_DELETE, CODE_FREE, CODE_REVERSE, CODE_FIND } from './types';

function cloneNodes(nodes: LLNode[]): LLNode[] {
  return nodes.map(n => ({ ...n }));
}

function cloneVars(vars: Variables): Variables {
  return { ...vars };
}

let addrCounter = 100;
function getNewAddress() {
  addrCounter += 4;
  return `0x${addrCounter.toString(16).toUpperCase()}`;
}

export function generateInsertFrames(
  initialNodes: LLNode[],
  initialHead: string | null,
  value: number,
  index: number
): Frame[] {
  const frames: Frame[] = [];
  let currentNodes = cloneNodes(initialNodes);
  let vars: Variables = { head: initialHead };

  const pushFrame = (line: number, exp: string) => {
    frames.push({
      nodes: cloneNodes(currentNodes),
      variables: cloneVars(vars),
      lineIndex: line,
      explanation: exp,
      codeSnippet: CODE_INSERT,
    });
  };

  pushFrame(0, `Calling insert_at_index(head, ${value}, ${index})`);

  // struct node *new_node = malloc(...)
  const newAddr = getNewAddress();
  let spawnY = 100;
  if (currentNodes.length > 0) {
    const max_y = Math.max(...currentNodes.map(n => n.y));
    spawnY = max_y + 150;
  }
  const newNode: LLNode = {
    id: `node-${Date.now()}`,
    address: newAddr,
    value: '?',
    next: '?',
    x: 100, // Default spawn position
    y: spawnY,
  };
  currentNodes.push(newNode);
  vars['new_node'] = newAddr;
  pushFrame(1, `Allocated new node at ${newAddr} (memory is uninitialized)`);

  // new_node->value = value;
  const n1 = currentNodes.find(n => n.address === newAddr);
  if (n1) n1.value = value;
  pushFrame(2, `Set new_node->value to ${value}`);

  // new_node->next = NULL;
  const n2 = currentNodes.find(n => n.address === newAddr);
  if (n2) n2.next = null;
  pushFrame(3, `Set new_node->next to NULL`);

  // if (index == 0 || head == NULL)
  pushFrame(5, `Check if we are inserting at head`);
  if (index === 0 || vars.head === null) {
    // new_node->next = head;
    const n = currentNodes.find(n => n.address === newAddr);
    if (n) n.next = vars.head;
    pushFrame(6, `Set new_node->next to head`);

    // return new_node;
    vars.head = newAddr;
    delete vars['new_node'];
    pushFrame(7, `Returned new_node as the new head`);
    return frames;
  }

  // struct node *curr = head;
  vars['curr'] = vars.head;
  pushFrame(10, `Initialize curr to head (${vars.head})`);

  // for (int i = 0; i < index - 1 && curr->next != NULL; i++)
  vars['i'] = 0;
  pushFrame(11, `Start loop to find insertion point`);
  
  while (vars['i'] < index - 1) {
    const currNode = currentNodes.find(n => n.address === vars['curr']);
    if (!currNode || currNode.next === null) break;

    // curr = curr->next;
    vars['curr'] = currNode.next;
    pushFrame(12, `Moved curr forward (i=${vars['i']})`);
    
    vars['i']++;
    pushFrame(11, `Increment i to ${vars['i']}`);
  }

  // new_node->next = curr->next;
  const cNode = currentNodes.find(n => n.address === vars['curr']);
  const nNode = currentNodes.find(n => n.address === newAddr);
  if (nNode && cNode) {
    nNode.next = cNode.next;
    pushFrame(15, `Point new_node->next to curr->next`);

    // curr->next = new_node;
    cNode.next = newAddr;
    pushFrame(16, `Point curr->next to new_node`);
  }

  // return head;
  delete vars['new_node'];
  delete vars['curr'];
  delete vars['i'];
  pushFrame(17, `Return head`);

  return frames;
}

export function generateDeleteFrames(
  initialNodes: LLNode[],
  initialHead: string | null,
  value: number
): Frame[] {
  const frames: Frame[] = [];
  let currentNodes = cloneNodes(initialNodes);
  let vars: Variables = { head: initialHead };

  const pushFrame = (line: number, exp: string) => {
    frames.push({
      nodes: cloneNodes(currentNodes),
      variables: cloneVars(vars),
      lineIndex: line,
      explanation: exp,
      codeSnippet: CODE_DELETE,
    });
  };

  pushFrame(0, `Calling delete_node(head, ${value})`);

  // if (head == NULL)
  pushFrame(1, `Check if head is NULL`);
  if (vars.head === null) {
    pushFrame(1, `Head is NULL, returning NULL`);
    return frames;
  }

  const headNode = currentNodes.find(n => n.address === vars.head);
  
  // if (head->value == value)
  pushFrame(3, `Check if head's value matches ${value}`);
  if (headNode && headNode.value === value) {
    // struct node *temp = head;
    vars['temp'] = vars.head;
    pushFrame(4, `temp points to head`);

    // head = head->next;
    vars.head = headNode.next;
    pushFrame(5, `head points to head->next`);

    // free(temp);
    currentNodes = currentNodes.filter(n => n.address !== vars['temp']);
    pushFrame(6, `Freed temp node`);

    // return head;
    delete vars['temp'];
    pushFrame(7, `Return new head`);
    return frames;
  }

  // struct node *curr = head;
  vars['curr'] = vars.head;
  pushFrame(10, `Initialize curr to head`);

  // while (curr->next != NULL && curr->next->value != value)
  pushFrame(11, `Start loop to find node to delete`);
  while (true) {
    const cNode = currentNodes.find(n => n.address === vars['curr']);
    if (!cNode || cNode.next === null) {
      pushFrame(11, `curr->next is NULL, end loop`);
      break;
    }
    const nextNode = currentNodes.find(n => n.address === cNode.next);
    if (nextNode && nextNode.value === value) {
      pushFrame(11, `Found node with value ${value}`);
      break;
    }

    // curr = curr->next;
    vars['curr'] = cNode.next;
    pushFrame(12, `Moved curr forward`);
    pushFrame(11, `Check loop condition`);
  }

  // if (curr->next != NULL)
  pushFrame(15, `Check if node was found (curr->next != NULL)`);
  const cNodeFinal = currentNodes.find(n => n.address === vars['curr']);
  if (cNodeFinal && cNodeFinal.next !== null) {
    // struct node *temp = curr->next;
    vars['temp'] = cNodeFinal.next;
    pushFrame(16, `temp points to node to delete (curr->next)`);

    // curr->next = temp->next;
    const tempNode = currentNodes.find(n => n.address === vars['temp']);
    if (tempNode) {
      cNodeFinal.next = tempNode.next;
      pushFrame(17, `curr->next bypasses temp (curr->next = temp->next)`);
    }

    // free(temp);
    currentNodes = currentNodes.filter(n => n.address !== vars['temp']);
    pushFrame(18, `Freed temp node`);
  }

  // return head;
  delete vars['curr'];
  delete vars['temp'];
  pushFrame(20, `Return head`);

  return frames;
}

export function generateFreeFrames(
  initialNodes: LLNode[],
  initialHead: string | null
): Frame[] {
  const frames: Frame[] = [];
  let currentNodes = cloneNodes(initialNodes);
  let vars: Variables = { head: initialHead };

  const pushFrame = (line: number, exp: string) => {
    frames.push({
      nodes: cloneNodes(currentNodes),
      variables: cloneVars(vars),
      lineIndex: line,
      explanation: exp,
      codeSnippet: CODE_FREE,
    });
  };

  pushFrame(0, `Calling free_list(head)`);

  // struct node *curr = head;
  vars['curr'] = vars.head;
  pushFrame(1, `Initialize curr to head`);

  // while (curr != NULL)
  pushFrame(2, `Start loop to free nodes`);
  while (vars['curr'] !== null) {
    const cNode = currentNodes.find(n => n.address === vars['curr']);
    if (!cNode) break;

    // struct node *temp = curr;
    vars['temp'] = vars['curr'];
    pushFrame(3, `temp points to curr`);

    // curr = curr->next;
    vars['curr'] = cNode.next === '?' ? null : cNode.next;
    pushFrame(4, `Moved curr forward`);

    // free(temp);
    currentNodes = currentNodes.filter(n => n.address !== vars['temp']);
    pushFrame(5, `Freed temp node`);
    
    pushFrame(2, `Check loop condition`);
  }

  delete vars['curr'];
  delete vars['temp'];
  vars.head = null;
  pushFrame(7, `Finished freeing list`);

  return frames;
}

export function generateReverseFrames(
  initialNodes: LLNode[],
  initialHead: string | null
): Frame[] {
  const frames: Frame[] = [];
  let currentNodes = cloneNodes(initialNodes);
  let vars: Variables = { head: initialHead };

  const pushFrame = (line: number, exp: string) => {
    frames.push({
      nodes: cloneNodes(currentNodes),
      variables: cloneVars(vars),
      lineIndex: line,
      explanation: exp,
      codeSnippet: CODE_REVERSE,
    });
  };

  pushFrame(0, `Calling reverse_list(head)`);

  vars['prev'] = null;
  pushFrame(1, `Initialize prev to NULL`);

  vars['curr'] = vars.head;
  pushFrame(2, `Initialize curr to head`);

  vars['next_node'] = null;
  pushFrame(3, `Initialize next_node to NULL`);

  pushFrame(5, `Start loop to reverse pointers`);
  while (vars['curr'] !== null) {
    const cNode = currentNodes.find(n => n.address === vars['curr']);
    if (!cNode) break;

    // next_node = curr->next;
    vars['next_node'] = cNode.next === '?' ? null : cNode.next;
    pushFrame(6, `Save next node (next_node = curr->next)`);

    // curr->next = prev;
    cNode.next = vars['prev'];
    pushFrame(7, `Reverse pointer (curr->next = prev)`);

    // prev = curr;
    vars['prev'] = vars['curr'];
    pushFrame(8, `Move prev forward (prev = curr)`);

    // curr = next_node;
    vars['curr'] = vars['next_node'];
    pushFrame(9, `Move curr forward (curr = next_node)`);

    pushFrame(5, `Check loop condition`);
  }

  vars.head = vars['prev'];
  delete vars['curr'];
  delete vars['next_node'];
  delete vars['prev'];
  pushFrame(12, `Return new head (prev)`);

  return frames;
}

export function generateFindFrames(
  initialNodes: LLNode[],
  initialHead: string | null,
  value: number
): Frame[] {
  const frames: Frame[] = [];
  let currentNodes = cloneNodes(initialNodes);
  let vars: Variables = { head: initialHead };

  const pushFrame = (line: number, exp: string) => {
    frames.push({
      nodes: cloneNodes(currentNodes),
      variables: cloneVars(vars),
      lineIndex: line,
      explanation: exp,
      codeSnippet: CODE_FIND,
    });
  };

  pushFrame(0, `Calling find_node(head, ${value})`);

  vars['curr'] = vars.head;
  pushFrame(1, `Initialize curr to head`);

  pushFrame(3, `Start loop to find node`);
  while (vars['curr'] !== null) {
    const cNode = currentNodes.find(n => n.address === vars['curr']);
    if (!cNode) break;

    pushFrame(4, `Check if curr->value == ${value}`);
    if (cNode.value === value) {
      delete vars['curr'];
      pushFrame(5, `Found node! Returning curr`);
      return frames;
    }

    vars['curr'] = cNode.next === '?' ? null : cNode.next;
    pushFrame(7, `Moved curr forward`);
    pushFrame(3, `Check loop condition`);
  }

  delete vars['curr'];
  pushFrame(10, `Node not found, returning NULL`);

  return frames;
}
