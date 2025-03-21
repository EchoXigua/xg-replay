import { FC, useEffect, useState } from 'react'
import { Space, Table, Tag, Select } from 'antd'
import type { TableProps } from 'antd'
import { css } from '@emotion/react'
import { useNavigate } from 'react-router-dom'

interface DataType {
  key: string
  name: string
  age: number
  address: string
  tags: string[]
}

const Index: FC = () => {
  const [projectOptions, setProjectOptions] = useState<Common.Option[]>([])

  useEffect(() => {
    getProjects()
  }, [])

  const getProjects = () => {
    const arr = [
      { value: 'jack', label: 'Jack' },
      { value: 'lucy', label: 'Lucy' },
      { value: 'Yiminghe', label: 'yiminghe' }
    ]
    setProjectOptions(arr)
  }

  const [curSelectedProject, setCurSelect] = useState('lucy')
  const handleChange = (val: string) => {
    setCurSelect(val)
  }

  const navigate = useNavigate() // 路由跳转函数
  const openDetail = (id: string) => {
    navigate('/replay/' + id)
  }

  const columns: TableProps<DataType>['columns'] = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      render: (text, { key }) => <a onClick={() => openDetail(key)}>{text}</a>
    },
    {
      title: 'Age',
      dataIndex: 'age',
      key: 'age'
    },
    {
      title: 'Address',
      dataIndex: 'address',
      key: 'address'
    },
    {
      title: 'Tags',
      key: 'tags',
      dataIndex: 'tags',
      render: (_, { tags }) => (
        <>
          {tags.map((tag) => {
            let color = tag.length > 5 ? 'geekblue' : 'green'
            if (tag === 'loser') {
              color = 'volcano'
            }
            return (
              <Tag color={color} key={tag}>
                {tag.toUpperCase()}
              </Tag>
            )
          })}
        </>
      )
    },
    {
      title: 'Action',
      key: 'action',
      render: (_, record) => (
        <Space size='middle'>
          <a> {record.name}</a>
          <a>Delete</a>
        </Space>
      )
    }
  ]

  const data: DataType[] = [
    {
      key: '1',
      name: 'John Brown',
      age: 32,
      address: 'New York No. 1 Lake Park',
      tags: ['nice', 'developer']
    },
    {
      key: '2',
      name: 'Jim Green',
      age: 42,
      address: 'London No. 1 Lake Park',
      tags: ['loser']
    },
    {
      key: '3',
      name: 'Joe Black',
      age: 32,
      address: 'Sydney No. 1 Lake Park',
      tags: ['cool', 'teacher']
    }
  ]

  return (
    <>
      <div className='page-container'>
        <div className='page-action'>
          <Select value={curSelectedProject} onChange={handleChange} options={projectOptions} />
        </div>
      </div>
      <Table<DataType> columns={columns} dataSource={data}></Table>
    </>
  )
}

export default Index
