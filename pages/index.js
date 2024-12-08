import Head from 'next/head'
import Image from 'next/image'
import styles from '../styles/Home.module.css'
import { useEffect, useState } from 'react'

export default function Home() {
    const[todos, setTodos] = useState([])
const handleFetch = async()=>{
    const response = await fetch('https://jsonplaceholder.typicode.com/todos')
    const data = await response.json()
    setTodos(data)
}
  return (
    <div className={styles.container}>
            <button onClick={handleFetch}>Fetch</button>
            {
                todos.map(todo=>(
                    <div key={todo.id}>
                        <h1>{todo.title}</h1>
                        <p>{todo.completed}</p>
                    </div>
                ))
            }
        </div>
  )
}
