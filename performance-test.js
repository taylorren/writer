// Ollama性能测试脚本 - 本机模型对比

const { Ollama } = require('ollama');

async function performanceTest(model, label) {
    console.log(`\n🚀 测试 ${label} (${model})`);
    console.log('='.repeat(50));

    const ollama = new Ollama({ host: 'http://localhost:11434' });

    try {
        // 测试1: 检查模型是否可用
        const models = await ollama.list();
        const availableModels = models.models.map(m => m.name);

        if (!availableModels.includes(model)) {
            console.log(`❌ 模型 ${model} 不可用`);
            console.log(`📋 可用模型: ${availableModels.join(', ')}`);
            console.log(`💡 请先拉取模型: ollama pull ${model}`);
            return null;
        }

        console.log(`✅ 模型 ${model} 可用`);

        // 测试2: 简单推理测试
        console.log('\n🧠 简单推理测试...');
        const testPrompt = '请用一句话描述人工智能的未来发展趋势。';

        const startInference = Date.now();
        const response = await ollama.chat({
            model: model,
            messages: [{ role: 'user', content: testPrompt }]
        });
        const inferenceTime = Date.now() - startInference;

        console.log(`⏱️  推理时间: ${inferenceTime}ms`);
        console.log(`📝 响应长度: ${response.message.content.length}字符`);
        console.log(`🎯 响应内容: ${response.message.content.substring(0, 100)}...`);

        // 测试3: 复杂分析测试（类似我们的核心思想分析）
        console.log('\n🔍 复杂分析测试...');
        const complexPrompt = `请分析以下核心思想的关键元素：
这是一个关于年轻程序员的科幻故事，主角在虚拟现实中冒险，最终拯救现实世界。

请以JSON格式返回：{"theme": "主题", "genre": "体裁", "characters": ["角色1"]}`;

        const startComplex = Date.now();
        const complexResponse = await ollama.chat({
            model: model,
            messages: [{ role: 'user', content: complexPrompt }]
        });
        const complexTime = Date.now() - startComplex;

        console.log(`⏱️  复杂分析时间: ${complexTime}ms`);
        console.log(`📊 分析结果: ${complexResponse.message.content.substring(0, 200)}...`);

        // 性能总结
        console.log(`\n📈 ${label} 性能总结:`);
        console.log(`- 简单推理: ${inferenceTime}ms`);
        console.log(`- 复杂分析: ${complexTime}ms`);
        console.log(`- 平均性能: ${Math.round((inferenceTime + complexTime) / 2)}ms`);

        return {
            model,
            inferenceTime,
            complexTime,
            avgTime: Math.round((inferenceTime + complexTime) / 2)
        };

    } catch (error) {
        console.error(`❌ ${label} 测试失败:`, error.message);
        return null;
    }
}

async function runModelComparison() {
    console.log('🏁 Ollama本机模型性能对比测试');
    console.log('测试将比较qwen3:latest、qwen3:4b和qwen3:1.7b的推理性能\n');

    // 测试qwen3:latest
    const latestResult = await performanceTest('qwen3:latest', 'Qwen3 Latest (完整版)');

    // 测试qwen3:4b
    const mediumResult = await performanceTest('qwen3:4b', 'Qwen3 4B (中等版)');

    // 测试qwen3:1.7b
    const smallResult = await performanceTest('qwen3:1.7b', 'Qwen3 1.7B (轻量版)');

    console.log('\n' + '='.repeat(60));
    console.log('🏆 模型性能对比结果');
    console.log('='.repeat(60));

    const results = [
        { name: 'Qwen3 Latest', result: latestResult },
        { name: 'Qwen3 4B    ', result: mediumResult },
        { name: 'Qwen3 1.7B  ', result: smallResult }
    ];

    // 显示所有结果
    results.forEach(({ name, result }) => {
        if (result) {
            console.log(`${name}: 平均 ${result.avgTime}ms (${(result.avgTime / 1000).toFixed(1)}秒)`);
        }
    });

    // 性能对比分析
    const availableResults = results.filter(r => r.result !== null);
    if (availableResults.length >= 2) {
        console.log(`\n🎯 性能对比分析:`);

        // 找出最快和最慢的模型
        const sortedResults = availableResults.sort((a, b) => a.result.avgTime - b.result.avgTime);
        const fastest = sortedResults[0];
        const slowest = sortedResults[sortedResults.length - 1];

        console.log(`- 最快模型: ${fastest.name.trim()} (${(fastest.result.avgTime / 1000).toFixed(1)}秒)`);
        console.log(`- 最慢模型: ${slowest.name.trim()} (${(slowest.result.avgTime / 1000).toFixed(1)}秒)`);

        if (fastest.result.avgTime !== slowest.result.avgTime) {
            const speedup = Math.round((slowest.result.avgTime / fastest.result.avgTime) * 100) / 100;
            const timeSaved = slowest.result.avgTime - fastest.result.avgTime;
            console.log(`- 速度提升: ${speedup}x 倍`);
            console.log(`- 时间节省: ${timeSaved}ms (${(timeSaved / 1000).toFixed(1)}秒)`);
        }

        // 详细对比
        if (latestResult && mediumResult) {
            const speedup4b = Math.round((latestResult.avgTime / mediumResult.avgTime) * 100) / 100;
            console.log(`\n📊 详细对比:`);
            console.log(`- Qwen3 4B 比 Latest 快 ${speedup4b}x`);
        }

        if (latestResult && smallResult) {
            const speedup17b = Math.round((latestResult.avgTime / smallResult.avgTime) * 100) / 100;
            console.log(`- Qwen3 1.7B 比 Latest 快 ${speedup17b}x`);
        }

        if (mediumResult && smallResult) {
            const speedup17vs4 = Math.round((mediumResult.avgTime / smallResult.avgTime) * 100) / 100;
            console.log(`- Qwen3 1.7B 比 4B 快 ${speedup17vs4}x`);
        }
    }

    // 使用建议
    console.log('\n💡 使用建议:');
    if (smallResult && smallResult.avgTime < 10000) {
        console.log('✅ 推荐 Qwen3 1.7B - 超快速度，适合实时交互');
    } else if (mediumResult && mediumResult.avgTime < 15000) {
        console.log('💡 推荐 Qwen3 4B - 平衡速度和质量');
    } else {
        console.log('🤔 推荐 Qwen3 Latest - 追求最佳质量');
    }

    console.log('\n🎯 应用场景建议:');
    console.log('- Qwen3 1.7B: 快速验证、实时反馈、简单分析');
    console.log('- Qwen3 4B: 日常使用、平衡性能、中等复杂度分析');
    console.log('- Qwen3 Latest: 深度分析、最终输出、复杂创作任务');

    // 安装提示
    const missingModels = [];
    if (!mediumResult) missingModels.push('qwen3:4b');
    if (!smallResult) missingModels.push('qwen3:1.7b');

    if (missingModels.length > 0) {
        console.log('\n📥 要安装缺失的模型，请运行:');
        missingModels.forEach(model => {
            console.log(`   ollama pull ${model}`);
        });
    }
}

runModelComparison();