'use client'

import { useState, useEffect } from 'react';
import { Box, Stack, Typography, Button, Modal, TextField, Grid, Card, CardContent, CardActions } from '@mui/material';
import { firestore } from '@/firebase'

import {
  collection,
  doc,
  getDocs,
  query,
  setDoc,
  deleteDoc,
  getDoc
} from 'firebase/firestore';

import Image from "next/image";
import styles from "./page.module.css";

const style = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: 400,
  bgcolor: 'background.paper',
  border: '2px solid #000',
  boxShadow: 24,
  p: 4,
  display: 'flex',
  flexDirection: 'column',
  gap: 3,
};

export default function Home() {
  const [inventory, setInventory] = useState([]);
  const [open, setOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [itemName, setItemName] = useState('');
  const [editItemName, setEditItemName] = useState('');
  const [editItemQuantity, setEditItemQuantity] = useState('');
  const [selectedItem, setSelectedItem] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState('list'); // New state to toggle between list and grid view

  const updateInventory = async () => {
    const snapshot = query(collection(firestore, 'inventory'));
    const docs = await getDocs(snapshot);
    const inventoryList = [];
    docs.forEach((doc) => {
      inventoryList.push({ name: doc.id, ...doc.data() });
    });
    setInventory(inventoryList);
  }
  
  useEffect(() => {
    updateInventory();
  }, []);

  const addItem = async (item) => {
    const docRef = doc(collection(firestore, 'inventory'), item);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const { quantity } = docSnap.data();
      await setDoc(docRef, { quantity: quantity + 1 });
    } else {
      await setDoc(docRef, { quantity: 1 });
    }
    await updateInventory();
  }
  
  const removeItem = async (item) => {
    const docRef = doc(collection(firestore, 'inventory'), item);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const { quantity } = docSnap.data();
      if (quantity === 1) {
        await deleteDoc(docRef);
      } else {
        await setDoc(docRef, { quantity: quantity - 1 });
      }
    }
    await updateInventory();
  }

  const updateItem = async () => {
    if (selectedItem) {
      const docRef = doc(collection(firestore, 'inventory'), selectedItem.name);
      await deleteDoc(docRef);  // Delete the old document with the old name

      const newDocRef = doc(collection(firestore, 'inventory'), editItemName);
      await setDoc(newDocRef, { quantity: Number(editItemQuantity) });
      await updateInventory();
      handleEditClose();
    }
  };

  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);

  const handleEditOpen = (item) => {
    setSelectedItem(item);
    setEditItemName(item.name);
    setEditItemQuantity(item.quantity);
    setEditOpen(true);
  };

  const handleEditClose = () => {
    setSelectedItem(null);
    setEditItemName('');
    setEditItemQuantity('');
    setEditOpen(false);
  };

  // Filter inventory based on search term
  const filteredInventory = inventory.filter(item =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const toggleViewMode = () => {
    setViewMode(viewMode === 'list' ? 'grid' : 'list');
  };

  return (
    <Box
      width="100vw"
      height="100vh"
      display={'flex'}
      justifyContent={'center'}
      flexDirection={'column'}
      alignItems={'center'}
      gap={2}
    >
      <Modal
        open={open}
        onClose={handleClose}
        aria-labelledby="modal-modal-title"
        aria-describedby="modal-modal-description"
      >
        <Box sx={style}>
          <Typography id="modal-modal-title" variant="h6" component="h2">
            Add Item
          </Typography>
          <Stack width="100%" direction={'row'} spacing={2}>
            <TextField
              id="outlined-basic"
              label="Item"
              variant="outlined"
              fullWidth
              value={itemName}
              onChange={(e) => setItemName(e.target.value)}
            />
            <Button
              variant="outlined"
              onClick={() => {
                addItem(itemName);
                setItemName('');
                handleClose();
              }}
            >
              Add
            </Button>
          </Stack>
        </Box>
      </Modal>

      <Modal
        open={editOpen}
        onClose={handleEditClose}
        aria-labelledby="modal-modal-edit-title"
        aria-describedby="modal-modal-edit-description"
      >
        <Box sx={style}>
          <Typography id="modal-modal-edit-title" variant="h6" component="h2">
            Edit Item
          </Typography>
          <Stack width="100%" direction={'column'} spacing={2}>
            <TextField
              id="outlined-basic-name"
              label="Item Name"
              variant="outlined"
              fullWidth
              value={editItemName}
              onChange={(e) => setEditItemName(e.target.value)}
            />
            <TextField
              id="outlined-basic-quantity"
              label="Quantity"
              variant="outlined"
              type="number"
              fullWidth
              value={editItemQuantity}
              onChange={(e) => setEditItemQuantity(e.target.value)}
            />
            <Button
              variant="outlined"
              onClick={updateItem}
            >
              Update
            </Button>
          </Stack>
        </Box>
      </Modal>

      <Button variant="contained" onClick={handleOpen}>
        Add New Item
      </Button>
      
      <TextField
        label="Search Inventory"
        variant="outlined"
        fullWidth
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        sx={{ marginBottom: 2, width: '800px' }}
      />
      
      <Button variant="contained" onClick={toggleViewMode}>
        Toggle View: {viewMode === 'list' ? 'Grid' : 'List'}
      </Button>

      {viewMode === 'list' ? (
        <Box border={'1px solid #333'}>
          <Box
            width="800px"
            height="100px"
            bgcolor={'#ADD8E6'}
            display={'flex'}
            justifyContent={'center'}
            alignItems={'center'}
          >
            <Typography variant={'h2'} color={'#333'} textAlign={'center'}>
              Inventory Items
            </Typography>
          </Box>
          <Stack width="800px" height="300px" spacing={2} overflow={'auto'}>
            {filteredInventory.map(({name, quantity}) => (
              <Box
                key={name}
                width="100%"
                minHeight="150px"
                display={'flex'}
                justifyContent={'space-between'}
                alignItems={'center'}
                bgcolor={'#f0f0f0'}
                paddingX={5}
              >
                <Typography variant={'h3'} color={'#333'} textAlign={'center'}>
                  {name.charAt(0).toUpperCase() + name.slice(1)}
                </Typography>
                <Typography variant={'h3'} color={'#333'} textAlign={'center'}>
                  {quantity}
                </Typography>
                <Stack direction={'row'} spacing={2}>
                <Button variant="contained" onClick={() => addItem(name)}>
                  Add
                </Button>
                <Button variant="contained" onClick={() => removeItem(name)}>
                  Remove
                </Button>
                <Button variant="contained" onClick={() => handleEditOpen({ name, quantity })}>
                  Edit
                </Button>
                </Stack>
              </Box>
            ))}
          </Stack>
        </Box>
      ) : (
        <Grid container spacing={2} width="800px">
          {filteredInventory.map(({ name, quantity }) => (
            <Grid item xs={12} sm={6} md={4} key={name}>
              <Card>
                <CardContent>
                  <Typography variant="h5" component="div">
                    {name.charAt(0).toUpperCase() + name.slice(1)}
                  </Typography>
                  <Typography variant="h6" color="text.secondary">
                    Quantity: {quantity}
                  </Typography>
                </CardContent>
                <CardActions>
                  <Button size="small" onClick={() => addItem(name)}>Add</Button>
                  <Button size="small" onClick={() => removeItem(name)}>Remove</Button>
                  <Button size="small" onClick={() => handleEditOpen({ name, quantity })}>Edit</Button>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  )
}
