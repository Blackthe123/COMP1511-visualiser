export interface LLNode {
  id: string;
  address: string;
  value: number | string;
  next: string | null;
  x: number;
  y: number;
}

export interface Variables {
  head: string | null;
  [key: string]: any;
}

export interface Frame {
  nodes: LLNode[];
  variables: Variables;
  lineIndex: number;
  explanation: string;
  codeSnippet: string;
}

export const CODE_INSERT = `struct node *insert_at_index(struct node *head, int value, int index) {
    struct node *new_node = malloc(sizeof(struct node));
    new_node->value = value;
    new_node->next = NULL;

    if (index == 0 || head == NULL) {
        new_node->next = head;
        return new_node;
    }

    struct node *curr = head;
    for (int i = 0; i < index - 1 && curr->next != NULL; i++) {
        curr = curr->next;
    }

    new_node->next = curr->next;
    curr->next = new_node;
    return head;
}`;

export const CODE_DELETE = `struct node *delete_node(struct node *head, int value) {
    if (head == NULL) return NULL;

    if (head->value == value) {
        struct node *temp = head;
        head = head->next;
        free(temp);
        return head;
    }

    struct node *curr = head;
    while (curr->next != NULL && curr->next->value != value) {
        curr = curr->next;
    }

    if (curr->next != NULL) {
        struct node *temp = curr->next;
        curr->next = temp->next;
        free(temp);
    }
    return head;
}`;

export const CODE_FREE = `void free_list(struct node *head) {
    struct node *curr = head;
    while (curr != NULL) {
        struct node *temp = curr;
        curr = curr->next;
        free(temp);
    }
}`;

export const CODE_REVERSE = `struct node *reverse_list(struct node *head) {
    struct node *prev = NULL;
    struct node *curr = head;
    struct node *next_node = NULL;

    while (curr != NULL) {
        next_node = curr->next;
        curr->next = prev;
        prev = curr;
        curr = next_node;
    }
    
    return prev;
}`;

export const CODE_FIND = `struct node *find_node(struct node *head, int value) {
    struct node *curr = head;
    
    while (curr != NULL) {
        if (curr->value == value) {
            return curr;
        }
        curr = curr->next;
    }
    
    return NULL;
}`;
