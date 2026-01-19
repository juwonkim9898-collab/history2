# Kubernetes 카나리 배포 가이드

## 📁 파일 구조
```
k8s/
├── namespace.yaml          # 네임스페이스 정의
├── configmap.yaml          # 환경 변수 설정
├── secrets.yaml            # 민감한 정보 (DB 비밀번호 등)
├── auth-api.yaml           # 인증 API (stable + canary)
├── library-api.yaml        # 라이브러리 API (stable + canary)
├── journal-api.yaml        # 저널 API (stable + canary)
├── image-generator-api.yaml # 이미지 생성 API (stable + canary)
├── stt-api.yaml            # STT API (stable + canary)
├── ingress.yaml            # 외부 트래픽 라우팅
└── hpa.yaml                # 자동 스케일링 설정
```

## 🚀 배포 순서

### 1. 네임스페이스 및 설정 생성
```bash
kubectl apply -f k8s/namespace.yaml
kubectl apply -f k8s/configmap.yaml
kubectl apply -f k8s/secrets.yaml
```

### 2. 서비스 배포
```bash
kubectl apply -f k8s/auth-api.yaml
kubectl apply -f k8s/library-api.yaml
kubectl apply -f k8s/journal-api.yaml
kubectl apply -f k8s/image-generator-api.yaml
kubectl apply -f k8s/stt-api.yaml
```

### 3. Ingress 및 HPA 설정
```bash
kubectl apply -f k8s/ingress.yaml
kubectl apply -f k8s/hpa.yaml
```

### 전체 한번에 배포
```bash
kubectl apply -f k8s/
```

## 🐤 카나리 배포 전략

### 트래픽 분배
- **Stable**: 2개 replica (약 67% 트래픽)
- **Canary**: 1개 replica (약 33% 트래픽)

### 카나리 배포 프로세스
1. canary 이미지 태그 업데이트
2. 모니터링 (에러율, 응답시간 확인)
3. 문제 없으면 stable 이미지 업데이트
4. canary replica 0으로 축소

### 롤백
```bash
# canary 배포 롤백
kubectl rollout undo deployment/library-api-canary -n history-app

# stable 배포 롤백
kubectl rollout undo deployment/library-api-stable -n history-app
```

## 📊 모니터링 명령어

```bash
# Pod 상태 확인
kubectl get pods -n history-app -l app=library-api

# 로그 확인
kubectl logs -f deployment/library-api-stable -n history-app
kubectl logs -f deployment/library-api-canary -n history-app

# HPA 상태 확인
kubectl get hpa -n history-app

# 서비스 상태 확인
kubectl get svc -n history-app
```

## 🔧 이미지 업데이트

```bash
# Canary 이미지 업데이트
kubectl set image deployment/library-api-canary \
  library-api=355627705292.dkr.ecr.ap-northeast-2.amazonaws.com/library-api:v1.2.0 \
  -n history-app

# Stable 이미지 업데이트 (카나리 검증 후)
kubectl set image deployment/library-api-stable \
  library-api=355627705292.dkr.ecr.ap-northeast-2.amazonaws.com/library-api:v1.2.0 \
  -n history-app
```

## ⚠️ 주의사항

1. **secrets.yaml**: 실제 배포 시 base64 인코딩된 값으로 교체
2. **ingress.yaml**: 실제 도메인으로 host 변경
3. **health check**: 각 API에 `/health` 엔드포인트 구현 필요
4. **ECR 인증**: EKS 노드에 ECR 접근 권한 필요
