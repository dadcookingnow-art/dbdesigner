import React, { useState } from 'react'
import { MessageCircle, GripVertical } from 'lucide-react'
import { ChatMessage, Project, Table, Relationship } from '../../types'
import { generateTableFromPrompt } from '../../utils/tableGenerator'
import { useResizable } from '../../hooks/useResizable'

interface ChatPanelProps {
  currentProject: Project | null
  chatHistory: ChatMessage[]
  setChatHistory: (messages: ChatMessage[]) => void
  addTable: (table: Table, relationships?: Relationship[]) => Promise<void>
}

export const ChatPanel: React.FC<ChatPanelProps> = ({
  currentProject,
  chatHistory,
  setChatHistory,
  addTable
}) => {
  const [chatInput, setChatInput] = useState('')
  const { width, isResizing, handleMouseDown } = useResizable({
    initialWidth: 384, // w-96 equivalent (384px)
    minWidth: 300,
    maxWidth: 600
  })

  const handleChatSubmit = async () => {
    if (!chatInput.trim() || !currentProject) return

    const newChatHistory = [
      ...chatHistory,
      { role: 'user' as const, content: chatInput }
    ]

    try {
      const { table: newTable, relationships: newRelationships } = generateTableFromPrompt(chatInput)
      
      await addTable(newTable, newRelationships)
      
      newChatHistory.push({
        role: 'assistant',
        content: `${newTable.name} 테이블을 생성했습니다! ${newRelationships?.length ? '관계선도 추가되었습니다.' : ''} 다이어그램에서 확인해보세요.`
      })
    } catch (error: any) {
      newChatHistory.push({
        role: 'assistant',
        content: `죄송합니다. 테이블 생성 중 오류가 발생했습니다: ${error.message}`
      })
    }

    setChatHistory(newChatHistory)
    setChatInput('')
  }

  return (
    <div className="relative bg-white border-r flex flex-col" style={{ width: `${width}px` }}>
      <div className="p-4 border-b bg-gray-50">
        <h2 className="font-semibold text-gray-900 flex items-center">
          <MessageCircle className="w-5 h-5 mr-2" />
          AI 어시스턴트
        </h2>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {chatHistory.map((message, index) => (
          <div key={index} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-xs px-4 py-2 rounded-lg ${
              message.role === 'user' 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-100 text-gray-900'
            }`}>
              {message.content}
            </div>
          </div>
        ))}
      </div>
      
      <div className="p-4 border-t">
        <div className="flex space-x-2">
          <input
            type="text"
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleChatSubmit()}
            placeholder="테이블 설명을 입력하세요..."
            className="flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <button
            onClick={handleChatSubmit}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            전송
          </button>
        </div>
        <div className="mt-2 text-xs text-gray-500">
          예: "사용자 주문 테이블을 만들어줘", "상품 리뷰 테이블이 필요해"
        </div>
      </div>
      
      {/* Resize Handle */}
      <div
        className={`absolute top-0 right-0 w-1 h-full cursor-col-resize bg-gray-300 hover:bg-blue-500 transition-colors ${
          isResizing ? 'bg-blue-500' : ''
        }`}
        onMouseDown={handleMouseDown}
        title="드래그해서 크기 조절"
      >
        <div className="absolute top-1/2 right-0 transform -translate-y-1/2 translate-x-1/2">
          <GripVertical className="w-3 h-3 text-gray-500 rotate-90" />
        </div>
      </div>
    </div>
  )
}