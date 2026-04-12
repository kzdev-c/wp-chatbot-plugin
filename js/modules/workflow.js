/**
 * Workflow System for handling predefined question trees.
 */

import { formatChatMessage, chat_clog } from './utils.js';
import { scrollToBottom } from './ui.js';

export const getWorkflowNode = (workflowData, nodeId) => {
    if (!workflowData || !workflowData.nodes) return null;
    return workflowData.nodes.find(n => n.id === nodeId) || null;
};

export const renderWorkflowNode = (container, workflowData, nodeId, botDisplayName, callbacks) => {
    const node = getWorkflowNode(workflowData, nodeId);
    if (!node) {
        chat_clog('[Workflow] Node not found:', nodeId);
        callbacks.onNodeNotFound();
        return;
    }

    callbacks.onNodeRender(nodeId, node);

    let optionsHtml = '';
    if (node.options && node.options.length > 0) {
        optionsHtml = '<div class="workflow-options">';
        node.options.forEach((opt, idx) => {
            const dataAttrs = `data-type="${opt.type}" data-index="${idx}" data-node="${nodeId}"`;
            let iconHtml = '';
            if (opt.type === 'ai_continuation') iconHtml = '<span class="wf-icon"><i class="fas fa-robot"></i></span>';
            else if (opt.type === 'live_chat') iconHtml = '<span class="wf-icon"><i class="fas fa-headset"></i></span>';
            optionsHtml += `<button class="workflow-option-btn" ${dataAttrs}>${iconHtml}${formatChatMessage(opt.label)}</button>`;
        });
        optionsHtml += '</div>';
    }

    container.append(`
        <div class="chatbot-message workflow-node" data-workflow-node="${nodeId}">
            <div class="workflow-question">
                <div class="message-header">${botDisplayName}</div>
                <div class="message-content">${formatChatMessage(node.question)}</div>
            </div>
            ${optionsHtml}
        </div>
    `);
    scrollToBottom(container);
};
