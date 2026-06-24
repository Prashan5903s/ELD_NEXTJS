'use client'

// import 'bootstrap/dist/css/bootstrap.min.css';
import { Modal, Button, Form, ListGroup } from 'react-bootstrap';

export default function NewGroupModal({ show, handleClose }) {
    const users = ['User 1', 'User 2', 'User 3', 'User 4']; // Dummy users

    return (
        <Modal show={show} onHide={handleClose}>
            <Modal.Header closeButton>
                <Modal.Title>Create New Group</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <Form>
                    <Form.Group>
                        <Form.Label>Group Name</Form.Label>
                        <Form.Control type="text" placeholder="Enter group name" />
                    </Form.Group>
                </Form>
                <hr />
                <h6>Select Users:</h6>
                <ListGroup>
                    {users.map((user, index) => (
                        <ListGroup.Item key={index}>
                            <Form.Check label={user} />
                        </ListGroup.Item>
                    ))}
                </ListGroup>
            </Modal.Body>
            <Modal.Footer>
                <Button variant="secondary" onClick={handleClose}>
                    Close
                </Button>
                <Button variant="primary" onClick={() => alert('Group Created')}>
                    Create Group
                </Button>
            </Modal.Footer>
        </Modal>
    );
}
