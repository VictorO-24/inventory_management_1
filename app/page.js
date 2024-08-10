"use client"
import Image from "next/image"
import {useState, useEffect} from "react"
import {firestore} from "@/firebase"
import {Box, Modal, Typography, Stack, TextField, Button} from "@mui/material"
import {collection, deleteDoc, doc, getDoc, setDoc, getDocs, query} from "firebase/firestore"
import * as cocoSsd from "@tensorflow-models/coco-ssd"
import "@tensorflow/tfjs"


export default function Home() {
  const [inventory, setInventory] = useState([])
  const [filteredInventory, setFilteredInventory] = useState([])
  const [open, setOpen] = useState(false)
  const [itemName, setItemName] = useState("")
  const [searchQuery, setSearchQuery] = useState("")
  const [showCamera, setShowCamera] = useState(false)
  const [cameraStream, setCameraStream] = useState(null)

  // Update Inventory from Firestore
  const updateInventory = async() => {
    const snapshot = query(collection(firestore, "inventory"))
    const docs = await getDocs(snapshot)
    const inventoryList = []
    docs.forEach((doc) => {
      inventoryList.push({
        name: doc.id,
        ...doc.data(),
      })
    })
    setInventory(inventoryList)
  } 


// Add Item to Inventory
  const addItem = async (item) => {
    const docRef = doc(collection(firestore, "inventory"), item)
    const docSnap = await getDoc(docRef)

    if(docSnap.exists()){
      const {quantity} = docSnap.data()
      await setDoc(docRef, {quantity: quantity + 1})
    } else {
      await setDoc(docRef, {quantity: 1})
    }

    await updateInventory()
  }

// Remove Item from Inventory
  const removeItem = async (item) => {
    const docRef = doc(collection(firestore, "inventory"), item)
    const docSnap = await getDoc(docRef)

    if(docSnap.exists()){
      const {quantity} = docSnap.data()
      if (quantity === 1) {
        await deleteDoc(docRef)
      } else {
        await setDoc(docRef, {quantity: quantity - 1})
      }
    }

    await updateInventory()
  }

  
  useEffect(() => {
    updateInventory()
  }, [])

  // Handle search query change
  useEffect(() => {
    const filtered = inventory.filter((item) =>
      item.name.toLowerCase().includes(searchQuery.toLowerCase())
    )
    setFilteredInventory(filtered)
  }, [searchQuery, inventory])

  
  const handleOpen = () => setOpen(true)
  const handleClose = () => setOpen(false)

  
// Handle View Item and Camera Access
const handleViewItem = async () => {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true })
    setCameraStream(stream)
    setShowCamera(true)
    const videoElement = document.querySelector("video")
    if (videoElement) {
      videoElement.srcObject = stream
    }
  } catch (err) {
    console.error("Error accessing the camera", err)
  }
}


// Handle Image Capture and YOLO Identification
const handleCapture = async () => {
  if (!cameraStream) return
  const video = document.querySelector("video")
  if (!video) return

  const canvas = document.createElement("canvas")
  canvas.width = video.videoWidth
  canvas.height = video.videoHeight
  const context = canvas.getContext("2d")
  context.drawImage(video, 0, 0)

  const imageData = canvas.toDataURL("image/jpeg")


  // Option 1: YOLO with TensorFlow.js (coco-ssd)
  const loadModelAndIdentify = async (imageData) => {
    const model = await cocoSsd.load()
    const img = new Image()
    img.src = imageData
    img.onload = async () => {
      const predictions = await model.detect(img)
      console.log(predictions)
      if (predictions.length > 0) {
        addItem(predictions[0].class) // Adds the first detected item to inventory
      }
    }
  }

  await loadModelAndIdentify(imageData)
  setShowCamera(false)
  cameraStream.getTracks().forEach((track) => track.stop()) // Ensure all tracks are stopped
  setCameraStream(null)
}

useEffect(() => {
  return () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach((track) => track.stop())
    }
  }
}, [cameraStream])

  return (
  <Box
    width="100vw"
    height="100vh"
    display="flex"
    flexDirection="column"
    justifyContent="center"
    alignItems="center"
    gap={2}
  >
    <Modal open={open} onClose={handleClose}>
      <Box
        position="absolute"
        top="50%"
        left="50%"
        width={400}
        bgcolor="white"
        border="2px solid #000"
        boxShadow={24}
        p={4}
        display="flex"
        flexDirection="column"
        gap={3}
        sx={{
          transform: "translate(-50%,-50%)",
        }}
      >
        <Typography variant="h6">Add Item</Typography>
        <Stack width="100%" direction="row" spacing={2}>
          <TextField
          variant="outlined"
          fullWidth
          value={itemName}
          onChange={(e) =>{
            setItemName(e.target.value)
          }}
          label="Item Name"
          />
          <Button 
          variant="outlined" 
          onClick={()=>{
            addItem(itemName)
            setItemName("")
            handleClose()
          }}
          >
            ADD
            </Button>
        </Stack>
      </Box>
    </Modal>

    <Typography variant="h1">Inventory Management</Typography>
    
  
    <Button variant="contained" onClick={handleOpen}>
        Add New Item
      </Button>

      <Button variant="contained" onClick={handleViewItem}>
        View Item
      </Button>


      {showCamera && (
  <Box mt={2}>
    <video
      autoPlay
      style={{ width: "100%", height: "auto" }}
      ref={(video) => {
        if (video && cameraStream) {
          video.srcObject = cameraStream
        }
      }}
    />
    <Button variant="contained" onClick={handleCapture}>
      Capture
    </Button>
  </Box>
)}


      <Box
        width="100%"
        maxWidth={600}
        bgcolor="#f0f0f0"  // Light gray background color
        p={2}
        mt={4}
        textAlign="center"
      >
        <Typography variant="h4" color="#333">
          Inventory Items
        </Typography>
      </Box>

{/* Search Box */}
<Box width="100%" maxWidth={600} mt={2}>
        <TextField
          fullWidth
          variant="outlined"
          label="Search Items"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </Box>

       {/* Inventory List */}
       <Box width="100%" maxWidth={600} mt={2}>
        {filteredInventory.length > 0 ? (
          filteredInventory.map((item, index) => (
            <Box
              key={index}
              display="flex"
              justifyContent="space-between"
              alignItems="center"
              p={2}
              borderBottom="1px solid #ddd"
            >
              <Typography>{item.name}</Typography>
              <Typography>Quantity: {item.quantity}</Typography>
              <Button
                variant="outlined"
                color="error"
                onClick={() => removeItem(item.name)}
              >
                Remove
              </Button>
            </Box>
          ))
        ) : (
          <Typography variant="body1" color="textSecondary">
            No items in inventory.
          </Typography>
        )}
      </Box>
    </Box>
  )
}